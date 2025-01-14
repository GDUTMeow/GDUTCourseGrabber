@echo off
chcp 65001
pip install pdm
pdm install
pdm add --dev nuitka
pdm run nuitka --standalone --include-data-dir=static=static --windows-icon-from-ico=static/icon.ico ^
--windows-company-name=GamerNoTitle --windows-product-name="GDUT抢课助手" --windows-file-version=3.0 ^
--windows-product-version=3.0 --lto=yes --assume-yes-for-downloads src/gdut_course_grabber/__main__.py
