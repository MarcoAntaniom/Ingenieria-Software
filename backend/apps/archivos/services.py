import mimetypes
import re
from pathlib import Path
from urllib.parse import quote

from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models import Q

from apps.academico.models import Inscripcion
from apps.academico.services import (
    es_admin_usuario,
    es_docente_usuario,
    obtener_secciones_usuario_ids,
)

MATERIAL_SECCION_RE = re.compile(r'^materiales/seccion_(\d+)/')


def es_archivo_local_fallback(archivo):
    url_guardada = getattr(archivo, 'url_publica', '') or ''
    return bool(
        url_guardada
        and '/media/' in url_guardada
        and 'r2.cloudflarestorage.com' not in url_guardada
    )


def obtener_mime_archivo(archivo):
    tipo = getattr(archivo, 'tipo_archivo', None)
    mime_tipo = getattr(tipo, 'mime_type', None)
    if mime_tipo:
        return mime_tipo
    nombre = getattr(archivo, 'nombre_original', '') or ''
    guessed, _ = mimetypes.guess_type(nombre)
    return guessed or 'application/octet-stream'


def obtener_url_archivo(archivo, request=None, download=False):
    """
    Genera una URL vigente para visualizar o descargar un Archivo.

    Cuando el almacenamiento está en Cloudflare R2 sin dominio personalizado,
    `default_storage.url()` emite URLs prefirmadas con expiración. Si se guarda
    esa URL estática en base de datos, expira (ej. tras 1 hora) y R2 responde
    con error 403/AccessDenied. Aquí se regenera dinámicamente en cada lectura.
    """
    url_guardada = getattr(archivo, 'url_publica', '') or ''
    nombre_almacenamiento = getattr(archivo, 'nombre_almacenamiento', '') or ''

    # Archivos guardados en disco local por el fallback de desarrollo (DEBUG=True)
    if es_archivo_local_fallback(archivo):
        if url_guardada.startswith('/') and request is not None:
            return request.build_absolute_uri(url_guardada)
        return url_guardada

    if not nombre_almacenamiento:
        return url_guardada

    nombre_original = (getattr(archivo, 'nombre_original', '') or 'archivo').replace('"', "'")
    nombre_ascii = nombre_original.encode('ascii', 'ignore').decode('ascii').strip() or 'archivo'
    nombre_utf8 = quote(nombre_original)
    disposition_type = 'attachment' if download else 'inline'
    content_disposition = (
        f'{disposition_type}; filename="{nombre_ascii}"; filename*=UTF-8\'\'{nombre_utf8}'
    )

    params = {'ResponseContentDisposition': content_disposition}
    mime_type = getattr(getattr(archivo, 'tipo_archivo', None), 'mime_type', None)
    if mime_type:
        params['ResponseContentType'] = mime_type

    try:
        return default_storage.url(
            nombre_almacenamiento,
            parameters=params,
            expire=86400,
        )
    except TypeError:
        url = default_storage.url(nombre_almacenamiento)
        if url.startswith('/') and request is not None:
            return request.build_absolute_uri(url)
        return url


def _abrir_archivo_local(nombre_almacenamiento):
    media_root = (Path(settings.BASE_DIR) / 'media').resolve()
    target_path = (media_root / nombre_almacenamiento).resolve()
    if media_root != target_path and media_root not in target_path.parents:
        raise FileNotFoundError('Ruta de archivo no válida.')
    if not target_path.is_file():
        raise FileNotFoundError(f'Archivo local no encontrado: {nombre_almacenamiento}')
    return open(target_path, 'rb')


def abrir_archivo_storage(archivo):
    """
    Abre un Archivo para lectura binaria desde disco local (fallback DEBUG) o
    desde `default_storage` (Cloudflare R2 / S3).
    """
    nombre_almacenamiento = getattr(archivo, 'nombre_almacenamiento', '') or ''
    if not nombre_almacenamiento:
        raise FileNotFoundError('El archivo no tiene una ruta de almacenamiento registrada.')

    if es_archivo_local_fallback(archivo):
        return _abrir_archivo_local(nombre_almacenamiento)

    try:
        return default_storage.open(nombre_almacenamiento, 'rb')
    except Exception:
        if settings.DEBUG:
            try:
                return _abrir_archivo_local(nombre_almacenamiento)
            except FileNotFoundError:
                pass
        raise


def usuario_puede_acceder_archivo(usuario, archivo):
    """
    Valida permisos de lectura/descarga sobre un Archivo:
    - Administradores: acceso total.
    - Quien subió el archivo (incluyendo estudiantes): acceso total a sus propios archivos.
    - Materiales de estudio (`materiales/seccion_<id>/`): usuarios pertenecientes a la sección.
    - Adjuntos de entregas: el estudiante dueño de la entrega (incluye retroalimentación docente)
      y docentes asignados a la sección de la tarea.
    - Adjuntos de anuncios: usuarios de la sección del anuncio o si el anuncio es global.
    - Archivos subidos por estudiantes de secciones impartidas por el docente: acceso docente.
    """
    if not usuario or not getattr(usuario, 'is_authenticated', False):
        return False

    if es_admin_usuario(usuario):
        return True

    user_id = getattr(usuario, 'id', None)
    if user_id is not None and getattr(archivo, 'subido_por_id', None) == user_id:
        return True

    secciones_ids = obtener_secciones_usuario_ids(usuario)
    if secciones_ids is None:
        return True

    nombre_almacenamiento = getattr(archivo, 'nombre_almacenamiento', '') or ''
    match_material = MATERIAL_SECCION_RE.match(nombre_almacenamiento)
    if match_material:
        return int(match_material.group(1)) in secciones_ids

    entregas_rel = getattr(archivo, 'entregas_asociadas', None)
    if entregas_rel is not None:
        if es_docente_usuario(usuario):
            if secciones_ids and entregas_rel.filter(
                entrega__tarea__seccion_id__in=secciones_ids
            ).exists():
                return True
        elif hasattr(usuario, 'perfil_estudiante'):
            if entregas_rel.filter(
                entrega__estudiante=usuario.perfil_estudiante
            ).exists():
                return True

    anuncios_rel = getattr(archivo, 'anuncios', None)
    if anuncios_rel is not None:
        filtro_anuncio = Q(anuncio__es_global=True) | Q(anuncio__seccion__isnull=True)
        if secciones_ids:
            filtro_anuncio |= Q(anuncio__seccion_id__in=secciones_ids)
        if anuncios_rel.filter(filtro_anuncio).exists():
            return True

    if es_docente_usuario(usuario) and secciones_ids and getattr(archivo, 'subido_por_id', None):
        if Inscripcion.objects.filter(
            seccion_id__in=secciones_ids,
            estudiante__usuario_id=archivo.subido_por_id,
        ).exists():
            return True

    return False
