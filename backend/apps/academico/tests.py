from django.test import SimpleTestCase
from django.urls import resolve


class AcademicApiEndpointTests(SimpleTestCase):
    def test_new_academic_models_have_list_and_detail_endpoints(self):
        endpoint_paths = (
            '/api/v1/academico/entregas-academicas/',
            '/api/v1/academico/entregas-academicas/1/',
            '/api/v1/academico/anuncios-academicos/',
            '/api/v1/academico/anuncios-academicos/1/',
            '/api/v1/academico/tareas/',
            '/api/v1/academico/tareas/1/',
            '/api/v1/academico/entregas-tareas/',
        )

        for endpoint_path in endpoint_paths:
            with self.subTest(endpoint_path=endpoint_path):
                self.assertIsNotNone(resolve(endpoint_path))
