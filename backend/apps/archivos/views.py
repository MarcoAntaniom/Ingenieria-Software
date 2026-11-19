import os
import uuid
import mimetypes
from pathlib import Path
from django.conf import settings
from django.core.files.storage import default_storage, FileSystemStorage
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academico.models import Seccion
from .models import Archivo, TipoArchivo
from .serializers import ArchivoSerializer, TipoArchivoSerializer
from .services import obtener_url_archivo

DEFAULT_MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'txt': 'text/plain',
    'csv': 'text/csv',
}


def es_docente_o_admin(usuario):
    if not usuario or not getattr(usuario, 'is_authenticated', False):
        return False
    rol = getattr(usuario, 'rol', None)
    if getattr(rol, 'id', None) == 1:
        return True
    codigo = (getattr(rol, 'codigo', '') or '').lower()
    nombre = (getattr(rol, 'nombre', '') or '').lower()
    if any(k in codigo or k in nombre for k in ('admin', 'docente', 'profesor', 'teacher')):
        return True
    if hasattr(usuario, 'perfil_docente'):
        return True
    return False


def almacenar_archivo_subido(
    uploaded_file,
    usuario,
    request=None,
    storage_prefix=None,
    custom_display_name=None,
):
    raw_filename = os.path.basename(uploaded_file.name or 'archivo')
    _, raw_ext = os.path.splitext(raw_filename)
    extension = raw_ext.lower().lstrip('.')

    if not extension or extension not in ALLOWED_EXTENSIONS:
        permitidas = ', '.join(f'.{ext}' for ext in sorted(ALLOWED_EXTENSIONS.keys()))
        raise ValueError(f"Extensión '.{extension}' no permitida. Formatos admitidos: {permitidas}")

    nombre_original = raw_filename
    if custom_display_name and custom_display_name.strip():
        clean_title = custom_display_name.strip()
        if not clean_title.lower().endswith(f'.{extension}'):
            nombre_original = f"{clean_title}.{extension}"
        else:
            nombre_original = clean_title

    guessed_mime, _ = mimetypes.guess_type(raw_filename)
    mime_type = uploaded_file.content_type or guessed_mime or ALLOWED_EXTENSIONS[extension]

    tipo_archivo, _ = TipoArchivo.objects.get_or_create(
        extension=extension,
        defaults={
            'mime_type': mime_type,
            'tamanio_maximo_bytes': DEFAULT_MAX_SIZE_BYTES,
        },
    )

    limite_bytes = tipo_archivo.tamanio_maximo_bytes or DEFAULT_MAX_SIZE_BYTES
    if uploaded_file.size > limite_bytes:
        limite_mb = limite_bytes / (1024 * 1024)
        actual_mb = uploaded_file.size / (1024 * 1024)
        raise ValueError(
            f"El archivo '{raw_filename}' pesa {actual_mb:.2f} MB y supera el máximo permitido ({limite_mb:.0f} MB)."
        )

    prefix = storage_prefix or f"uploads/{usuario.id}"
    unique_key = f"{prefix.rstrip('/')}/{uuid.uuid4().hex}.{extension}"

    try:
        saved_path = default_storage.save(unique_key, uploaded_file)
        url_publica = default_storage.url(saved_path)
    except Exception:
        if not settings.DEBUG:
            raise
        media_root = Path(settings.BASE_DIR) / 'media'
        local_storage = FileSystemStorage(location=str(media_root), base_url='/media/')
        uploaded_file.seek(0)
        saved_path = local_storage.save(unique_key, uploaded_file)
        relative_url = local_storage.url(saved_path)
        url_publica = request.build_absolute_uri(relative_url) if request else relative_url

    return Archivo.objects.create(
        subido_por=usuario,
        tipo_archivo=tipo_archivo,
        nombre_original=nombre_original,
        nombre_almacenamiento=saved_path,
        url_publica=url_publica,
        peso_bytes=uploaded_file.size,
    )


class ArchivoListUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        queryset = Archivo.objects.select_related(
            'tipo_archivo', 'subido_por'
        ).order_by('-creado_en')

        solo_mios = request.query_params.get('mios', '').lower() in {'true', '1'}
        if solo_mios:
            queryset = queryset.filter(subido_por=request.user)

        serializer = ArchivoSerializer(queryset, many=True, context={'request': request})
        return Response(
            {
                'mensaje': 'Archivos obtenidos correctamente',
                'datos': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        files = request.FILES.getlist('archivos') or request.FILES.getlist('archivo')
        if not files:
            return Response(
                {'mensaje': 'Debes adjuntar al menos un archivo en el campo "archivo" o "archivos".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        creados = []
        try:
            for f in files:
                archivo_obj = almacenar_archivo_subido(f, request.user, request=request)
                creados.append(archivo_obj)
        except ValueError as exc:
            return Response(
                {'mensaje': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as exc:
            return Response(
                {'mensaje': f'No se pudo almacenar el archivo: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serialized = ArchivoSerializer(creados, many=True, context={'request': request}).data
        return Response(
            {
                'mensaje': 'Archivo(s) subido(s) correctamente',
                'datos': serialized if len(serialized) > 1 else serialized[0],
                'archivos': serialized,
            },
            status=status.HTTP_201_CREATED,
        )


class MaterialEstudioListCreateView(APIView):
    """
    Lista y publica Materiales de Estudio asignados obligatoriamente a una sección.
    Cualquier usuario autenticado puede consultarlos, pero SOLO docentes y
    administradores pueden subir nuevos materiales.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        seccion_id = request.query_params.get('seccion')
        if seccion_id:
            prefix = f"materiales/seccion_{seccion_id}/"
        else:
            prefix = "materiales/seccion_"

        queryset = Archivo.objects.select_related(
            'tipo_archivo', 'subido_por'
        ).filter(
            nombre_almacenamiento__startswith=prefix
        ).order_by('-creado_en')

        serializer = ArchivoSerializer(queryset, many=True, context={'request': request})
        return Response(
            {
                'mensaje': 'Materiales de estudio obtenidos correctamente',
                'datos': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        if not es_docente_o_admin(request.user):
            return Response(
                {'mensaje': 'Permiso denegado: solo docentes y administradores pueden subir materiales de estudio.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        seccion_raw = request.data.get('seccion')
        if not seccion_raw or not str(seccion_raw).strip():
            return Response(
                {'mensaje': 'Los materiales de estudio deben asignarse obligatoriamente a una sección (no en general).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            seccion_obj = Seccion.objects.get(pk=int(str(seccion_raw).strip()))
        except (ValueError, TypeError, Seccion.DoesNotExist):
            return Response(
                {'mensaje': 'La sección indicada para el material de estudio no es válida.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        files = request.FILES.getlist('archivos') or request.FILES.getlist('archivo')
        if not files:
            return Response(
                {'mensaje': 'Debes arrastrar o seleccionar al menos un archivo de material.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        titulo = request.data.get('titulo')
        prefix = f"materiales/seccion_{seccion_obj.id}"

        creados = []
        try:
            for idx, f in enumerate(files):
                display_name = None
                if titulo and titulo.strip():
                    display_name = titulo.strip() if len(files) == 1 else f"{titulo.strip()} ({idx + 1})"
                archivo_obj = almacenar_archivo_subido(
                    f,
                    request.user,
                    request=request,
                    storage_prefix=prefix,
                    custom_display_name=display_name,
                )
                creados.append(archivo_obj)
        except ValueError as exc:
            return Response({'mensaje': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response(
                {'mensaje': f'No se pudo almacenar el material: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serialized = ArchivoSerializer(creados, many=True, context={'request': request}).data
        return Response(
            {
                'mensaje': 'Material(es) de estudio publicado(s) exitosamente en la sección',
                'datos': serialized,
                'archivos': serialized,
            },
            status=status.HTTP_201_CREATED,
        )


class ArchivoDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        # Regla de negocio: un estudiante NO puede borrar archivos que subió.
        if not es_docente_o_admin(request.user):
            return Response(
                {'mensaje': 'Los estudiantes no tienen permiso para eliminar archivos subidos.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        archivo = get_object_or_404(Archivo, pk=pk)
        es_admin = getattr(getattr(request.user, 'rol', None), 'id', None) == 1 or (
            getattr(getattr(request.user, 'rol', None), 'codigo', '') or ''
        ).lower() == 'admin'

        if archivo.subido_por_id != request.user.id and not es_admin:
            return Response(
                {'mensaje': 'Solo el docente autor o un administrador puede eliminar este archivo.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        archivo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ArchivoDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        archivo = get_object_or_404(Archivo, pk=pk)
        forzar_descarga = request.query_params.get('download', '').lower() in {'1', 'true', 'yes'}
        url = obtener_url_archivo(archivo, request=request, download=forzar_descarga)
        return HttpResponseRedirect(url)


class TipoArchivoListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tipos = TipoArchivo.objects.all().order_by('extension')
        return Response(
            {
                'mensaje': 'Tipos de archivo permitidos',
                'datos': TipoArchivoSerializer(tipos, many=True).data,
            },
            status=status.HTTP_200_OK,
        )
