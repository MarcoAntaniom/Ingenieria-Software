from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.test import RequestFactory, SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from .serializers import ArchivoSerializer
from .services import obtener_url_archivo
from .views import ArchivoDownloadView


class ObtenerUrlArchivoTests(SimpleTestCase):
    def setUp(self):
        self.archivo_r2 = SimpleNamespace(
            id=1,
            subido_por_id=10,
            subido_por=SimpleNamespace(pk=10, nombres='Ana', apellidos='Pérez'),
            tipo_archivo=SimpleNamespace(
                id=1,
                extension='pdf',
                mime_type='application/pdf',
                tamanio_maximo_bytes=52428800,
            ),
            nombre_original='Guía de Estudio 1.pdf',
            nombre_almacenamiento='materiales/seccion_1/abc123.pdf',
            url_publica='https://acct.r2.cloudflarestorage.com/bucket/materiales/seccion_1/abc123.pdf?X-Amz-Date=20200101T000000Z&X-Amz-Expires=3600&X-Amz-Signature=expired',
            peso_bytes=1024,
            creado_en='2026-11-18T12:00:00Z',
        )

    def test_regenera_url_prefirmada_vigente_para_r2(self):
        url = obtener_url_archivo(self.archivo_r2)
        parsed = urlparse(url)
        query = parse_qs(parsed.query)

        self.assertIn('r2.cloudflarestorage.com', parsed.netloc)
        self.assertNotEqual(url, self.archivo_r2.url_publica)
        self.assertEqual(query.get('X-Amz-Expires'), ['86400'])
        self.assertIn('inline;', query.get('response-content-disposition', [''])[0])
        self.assertIn('Gu%C3%ADa%20de%20Estudio%201.pdf', query.get('response-content-disposition', [''])[0])

    def test_download_true_usa_disposition_attachment(self):
        url = obtener_url_archivo(self.archivo_r2, download=True)
        query = parse_qs(urlparse(url).query)
        self.assertIn('attachment;', query.get('response-content-disposition', [''])[0])

    def test_preserva_url_local_de_fallback_media(self):
        factory = RequestFactory()
        request = factory.get('/api/v1/archivos/')
        archivo_local = SimpleNamespace(
            nombre_original='nota.txt',
            nombre_almacenamiento='uploads/1/nota.txt',
            url_publica='/media/uploads/1/nota.txt',
        )

        url = obtener_url_archivo(archivo_local, request=request)
        self.assertEqual(url, 'http://testserver/media/uploads/1/nota.txt')

    def test_serializer_retorna_url_regenerada(self):
        serializer = ArchivoSerializer(self.archivo_r2)
        data = serializer.data
        self.assertNotEqual(data['url_publica'], self.archivo_r2.url_publica)
        self.assertIn('X-Amz-Expires=86400', data['url_publica'])

    @patch('apps.archivos.views.get_object_or_404')
    def test_download_view_redirige_a_url_vigente(self, mock_get_object):
        mock_get_object.return_value = self.archivo_r2
        factory = APIRequestFactory()
        request = factory.get('/api/v1/archivos/1/descargar/?download=1')
        user = SimpleNamespace(is_authenticated=True, id=10)
        force_authenticate(request, user=user)

        response = ArchivoDownloadView.as_view()(request, pk=1)
        self.assertEqual(response.status_code, 302)
        query = parse_qs(urlparse(response['Location']).query)
        self.assertIn('attachment;', query.get('response-content-disposition', [''])[0])
