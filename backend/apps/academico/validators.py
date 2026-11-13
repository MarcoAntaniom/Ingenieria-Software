from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator

def validar_tamanio_archivo(archivo):
    """Valida que el archivo no supere los 50 MB (Requerimiento de tamaño máximo)."""
    limite_mb = 50 * 1024 * 1024  # 50 MB en bytes
    if archivo.size > limite_mb:
        tamanio_actual = archivo.size / (1024 * 1024)
        raise ValidationError(
            f"El archivo pesa {tamanio_actual:.2f} MB y supera el límite permitido de 50 MB."
        )

# Validador de extensiones base (PDF, DOCX, ZIP)
validador_extensiones = FileExtensionValidator(
    allowed_extensions=['pdf', 'docx', 'zip'],
    message="Solo se permiten archivos con extensión: .pdf, .docx, .zip"
)

