import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings

def _get_fernet_client():
    """Genera una llave de cifrado segura basada en el SECRET_KEY de Django."""
    password = settings.SECRET_KEY.encode()
    salt = b'academico_secure_salt_messaging' # Sal fija para derivación consistente
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password))
    return Fernet(key)

def cifrar_mensaje(texto_plano: str) -> str:
    """Cifra un texto plano y lo retorna en formato string cifrado."""
    if not texto_plano:
        return ""
    f = _get_fernet_client()
    cifrado_bytes = f.encrypt(texto_plano.encode('utf-8'))
    return cifrado_bytes.decode('utf-8')

def descifrar_mensaje(texto_cifrado: str) -> str:
    """Desencripta un texto cifrado de la base de datos a texto plano."""
    if not texto_cifrado:
        return ""
    try:
        f = _get_fernet_client()
        descifrado_bytes = f.decrypt(texto_cifrado.encode('utf-8'))
        return descifrado_bytes.decode('utf-8')
    except Exception:
        # En caso de error de desencriptación o formato antiguo sin cifrar
        return "[Mensaje no pudo ser descifrado]"