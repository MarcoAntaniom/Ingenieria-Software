from django.db import models

# Modelos de usuarios.

class Roles(models.Model):
    # Tabla roles
    nombre = models.CharField(max_length=70)
    codigo = models.CharField(max_length=30, unique=True)
    descripcion = models.CharField(max_length=120)

    class Meta:
        db_table = 'roles' # Nombre de la tabla en la base de datos.
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return f"{self.nombre} {self.codigo}"

class Usuarios(models.Model):
    # Tabla usuarios
    rut = models.CharField(max_length=12, unique=True)
    nombres = models.CharField(max_length=70)
    apellidos = models.CharField(max_length=70)
    correo_institucional = models.EmailField(max_length=100, unique=True)
    password_hash = models.CharField(max_length=255)
    rol = models.ForeignKey(Roles, on_delete=models.RESTRICT, related_name='usuarios')
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.rut})"

class PerfilEstudiante(models.Model):
    # Tabla perfiles_estudiante
    usuario = models.OneToOneField(Usuarios, on_delete=models.CASCADE, related_name='perfil_estudiante')
    carrera = models.ForeignKey('academico.Carrera', on_delete=models.RESTRICT, related_name='estudiantes')
    nivel = models.IntegerField()
    anio_ingreso = models.IntegerField()

    class Meta:
        db_table = 'perfiles_estudiante'
        verbose_name = 'PerfilEstudiante'
        verbose_name_plural = 'PerfilesEstudiantes'

    def __str__(self):
        return f"Estudiante: {self.usuario.nombres} {self.usuario.apellidos}"

class PerfilDocente(models.Model):
    # Tabla perfiles_docente
    usuario = models.OneToOneField(Usuarios, on_delete=models.CASCADE, related_name='perfil_docente')
    departamento = models.ForeignKey('academico.Departamento', on_delete=models.RESTRICT, related_name='docentes')
    especialidad = models.CharField(max_length=120, blank=True, null=True)

    class Meta:
        db_table = 'perfiles_docente'
        verbose_name = 'PerfilDocente'
        verbose_name_plural = 'PerfilesDocentes'

    def __str__(self):
        return f"Docente: {self.usuario.nombres} {self.usuario.apellidos}"
