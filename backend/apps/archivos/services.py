from urllib.parse import quote
from django.core.files.storage import default_storage


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
    if url_guardada and '/media/' in url_guardada and 'r2.cloudflarestorage.com' not in url_guardada:
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

    try:
        return default_storage.url(
            nombre_almacenamiento,
            parameters={'ResponseContentDisposition': content_disposition},
            expire=86400,
        )
    except TypeError:
        url = default_storage.url(nombre_almacenamiento)
        if url.startswith('/') and request is not None:
            return request.build_absolute_uri(url)
        return url
