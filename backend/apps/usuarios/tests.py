from django.test import TestCase
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from rest_framework import status
from apps.usuarios.models import Roles, Usuarios

class LoginSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rol_estudiante = Roles.objects.create(
            codigo='ESTUDIANTE',
            nombre='Estudiante',
            descripcion='Alumno regular'
        )
        self.usuario_activo = Usuarios.objects.create(
            rut='20.123.456-7',
            nombres='Esteban',
            apellidos='Morales Sepúlveda',
            correo_institucional='estudiante@universidad.cl',
            password_hash=make_password('PasswordSegura123!'),
            rol=self.rol_estudiante,
            activo=True
        )
        self.usuario_inactivo = Usuarios.objects.create(
            rut='19.876.543-2',
            nombres='Usuario',
            apellidos='Bloqueado',
            correo_institucional='bloqueado@universidad.cl',
            password_hash=make_password('PasswordSegura123!'),
            rol=self.rol_estudiante,
            activo=False
        )

    def test_login_exitoso_y_normalizacion(self):
        """El login debe funcionar con espacios accidentales y mayúsculas en el email."""
        response = self.client.post(
            '/api/v1/usuarios/login/',
            {
                'correo_institucional': '  ESTUDIANTE@UNIVERSIDAD.CL  ',
                'password': 'PasswordSegura123!'
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        datos = response.data.get('datos', {})
        self.assertIn('access', datos)
        self.assertIn('refresh', datos)
        self.assertIn('usuario', datos)
        self.assertEqual(datos['usuario']['rol']['codigo'], 'ESTUDIANTE')

    def test_prevencion_enumeracion_usuario_inexistente(self):
        """Un usuario que no existe debe retornar 401 con mensaje genérico."""
        response = self.client.post(
            '/api/v1/usuarios/login/',
            {
                'correo_institucional': 'inexistente@universidad.cl',
                'password': 'PasswordSegura123!'
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('Credenciales incorrectas', str(response.data))

    def test_prevencion_enumeracion_password_erroneo(self):
        """Una contraseña incorrecta debe retornar 401 con el MISMO mensaje genérico."""
        response = self.client.post(
            '/api/v1/usuarios/login/',
            {
                'correo_institucional': 'estudiante@universidad.cl',
                'password': 'PasswordEquivocada!'
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('Credenciales incorrectas', str(response.data))

    def test_cuenta_inactiva_retorna_403(self):
        """Una cuenta inactiva o bloqueada debe retornar 403 Forbidden."""
        response = self.client.post(
            '/api/v1/usuarios/login/',
            {
                'correo_institucional': 'bloqueado@universidad.cl',
                'password': 'PasswordSegura123!'
            },
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('inactiva', str(response.data).lower())

    def test_validacion_bad_request_campos_faltantes(self):
        """Peticiones sin contraseña o sin correo deben retornar 400 Bad Request."""
        response = self.client.post(
            '/api/v1/usuarios/login/',
            {'correo_institucional': 'estudiante@universidad.cl'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validacion_bad_request_formato_email_invalido(self):
        """Emails con formato inválido deben ser rechazados con 400 Bad Request."""
        response = self.client.post(
            '/api/v1/usuarios/login/',
            {'correo_institucional': 'no-es-un-email', 'password': '123'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
