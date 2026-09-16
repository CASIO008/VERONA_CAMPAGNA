@echo off
chcp 65001 >nul
title VERONA CAMPAGNA - abrir a loja
cd /d "%~dp0"
echo.
echo   VERONA CAMPAGNA - Gioielli
echo   ---------------------------------------------
echo   Abrindo a loja no seu navegador padrao.
echo.
echo   Tudo funciona sem servidor: sacola, favoritos,
echo   checkout e pedidos ficam guardados no proprio
echo   navegador. Nada de numero de cartao e gravado.
echo.
echo   Dica: na primeira visita aparece a abertura 3D.
echo   ---------------------------------------------
echo.
start "" "%~dp0index.html"
timeout /t 3 >nul
