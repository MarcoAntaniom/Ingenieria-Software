from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/usuarios/', include('apps.usuarios.urls')),
    path('api/v1/academico/', include('apps.academico.urls')),
    path('api/v1/evaluaciones/', include('apps.evaluaciones.urls')),
    path('api/v1/comunicacion/', include('apps.comunicacion.urls')),
    path('api/v1/archivos/', include('apps.archivos.urls')),
    path('api/v1/notificaciones/', include('apps.notificaciones.urls')),
]

if settings.DEBUG:
    urlpatterns += static('/media/', document_root=settings.BASE_DIR / 'media')
