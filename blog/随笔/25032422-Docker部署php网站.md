---
title: 使用 Docker 容器部署 PHP 网站
description: ""
date: 2025-03-24 22:57:11
category: Docker
tags: ["Docker", "PHP"]
---

今天朋友给我讲给客户部署 PHP 网站一直遇到问题让我帮助，我看了下系统环境，宝塔面板，好几个 Nginx 程序，还有 Apache 服务器，乱七八糟的什么都有，各个服务器占用 80 443 端口，PHP 环境也有问题，然后我觉得也别折腾主机环境了，把程序该卸载卸载了，进程该结束结束了，使用 Docker 部署吧，把环境隔离开，然后就是整的这些东西。

<!--more-->

```sh
# 所有文件都在 /data/docker 目录下

nginx/
----ssl/
--------域名证书
----nginx.conf
php/
----web/
--------网站项目文件
```

## 构建 PHP 镜像

PHP 的官方镜像少了很多拓展，所以自己构建一个包含程序所有依赖的镜像。

`dockerfile` 文件

```sh
# 使用PHP官方镜像作为基础依赖
FROM php:7.4-fpm
# 更改软件源为清华源，为了后续的安装加速，PHP官方镜像使用Debian作为基础镜像
# 这里安装了gd mysqli pdo pdo_mysql这几个拓展
# 并且安装这些拓展的环境依赖
RUN apt install apt-transport-https ca-certificates && \
    echo > /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-updates main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.tuna.tsinghua.edu.cn/debian/ bookworm-backports main contrib non-free non-free-firmware" >> /etc/apt/sources.list && \
    apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd mysqli pdo pdo_mysql
```

使用 docker build 构建镜像

```sh
docker build image:tag .
```

## nginx 配置文件和域名证书

`nginx.conf` 文件

```sh
user nginx;
worker_processes auto;

error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 443 ssl;

        root /var/www/html;
        index index.php index.html;
        ssl_certificate    /etc/nginx/ssl/domain.com.pem;
        ssl_certificate_key    /etc/nginx/ssl/domain.com.key;
        location / {
            try_files $uri $uri/ =404;
        }

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass app-php:9000;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        }
    }
}

```

## 使用 docker-compose 管理应用程序容器编排

`docker-compose.yml` 文件

```yml
version: "3.8"
services:
  app-nginx:
    image: nginx:latest
    container_name: app-nginx
    ports:
      - "38888:443"
      - "38887:80"
      - "443:443"
      - "80:80"
    volumes:
      - /data/docker/nginx/ssl:/etc/nginx/ssl
      - /data/docker/nginx/nginx.conf:/etc/nginx/nginx.conf
      - /data/docker/php/web:/var/www/html
    depends_on:
      - app-php
    networks:
      - app-network

  app-php:
    image: php-mysql:0.0.2
    container_name: app-php
    volumes:
      - /data/docker/php/web:/var/www/html
    networks:
      - app-network

  app-mysql:
    image: mysql:latest
    container_name: app-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root@pass2025
      MYSQL_DATABASE: my_database
      MYSQL_USER: user
      MYSQL_PASSWORD: user@pass2025
    ports:
      - "3306:3306"
    volumes:
      - /data/docker/mysql-data:/var/lib/mysql
    networks:
      - app-network

volumes:
  mysql-data:

networks:
  app-network:
```

完事之后使用 `docker-compose up -d` 运行所有容器
