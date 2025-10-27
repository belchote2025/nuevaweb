@echo off
echo ========================================
echo    CREANDO ZIP PARA DESPLIEGUE
echo    Filá Mariscales Web
echo ========================================
echo.

echo [1/4] Preparando archivos...

:: Crear directorio temporal
if exist "temp-despliegue" rmdir /s /q "temp-despliegue"
mkdir "temp-despliegue"

echo [2/4] Copiando archivos principales...
copy "index.html" "temp-despliegue\"
copy "admin.html" "temp-despliegue\"
copy "login.html" "temp-despliegue\"
copy "*.html" "temp-despliegue\"
copy "manifest.json" "temp-despliegue\"
copy "sw.js" "temp-despliegue\"
copy "sw.php" "temp-despliegue\"
copy ".htaccess" "temp-despliegue\"
copy "robots.txt" "temp-despliegue\"
copy "sitemap.xml" "temp-despliegue\"

echo [3/4] Copiando directorios...
xcopy "assets" "temp-despliegue\assets\" /E /I /Q
xcopy "api" "temp-despliegue\api\" /E /I /Q
xcopy "data" "temp-despliegue\data\" /E /I /Q
xcopy "uploads" "temp-despliegue\uploads\" /E /I /Q

echo [4/4] Copiando archivos de instalación...
copy "instalar.php" "temp-despliegue\"
copy "verificar-despliegue.php" "temp-despliegue\"
copy "backup.php" "temp-despliegue\"
copy "health.php" "temp-despliegue\"
copy "deployment-config.php" "temp-despliegue\"
copy "config-prod.php" "temp-despliegue\"
copy ".env" "temp-despliegue\"
copy "crontab.txt" "temp-despliegue\"
copy "README_DESPLIEGUE.md" "temp-despliegue\"
copy "INSTRUCCIONES_DESPLIEGUE.md" "temp-despliegue\"

echo.
echo [INFO] Creando directorios necesarios...
mkdir "temp-despliegue\logs" 2>nul
mkdir "temp-despliegue\backups" 2>nul
mkdir "temp-despliegue\cache" 2>nul

echo.
echo ========================================
echo    ZIP CREADO EXITOSAMENTE
echo ========================================
echo.
echo Archivos listos en: temp-despliegue\
echo.
echo Ahora puedes:
echo 1. Comprimir la carpeta temp-despliegue en ZIP
echo 2. Subir el ZIP a tu hosting
echo 3. Extraer en public_html
echo.
echo Presiona cualquier tecla para abrir la carpeta...
pause >nul
explorer "temp-despliegue"
