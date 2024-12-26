@echo off
chcp 65001
nuitka --standalone --include-data-dir=templates=templates --include-data-dir=static=static --windows-icon-from-ico=img/icon.ico --windows-company-name=GamerNoTitle --windows-product-name="GDUT抢课助手" --windows-file-version=2.0 --windows-product-version=2.0 --lto=yes --assume-yes-for-downloads app.py
