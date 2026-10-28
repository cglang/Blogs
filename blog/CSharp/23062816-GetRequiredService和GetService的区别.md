---
title: .NET 中 GetRequiredService() 和 GetService() 的区别
description: ""
date: 2023-06-28 16:51:01
category: ".NET"
tags: [".NET"]
---

## .NET 中 GetRequiredService() 和 GetService() 的区别

在 .NET 中，GetRequiredService() 和 GetService() 都是用于从依赖注入容器中获取服务实例的方法，它们之间的区别在于当容器中没有所请求的服务时，它们的行为会有所不同。

GetRequiredService() 方法会在容器中查找所请求的服务类型，如果找不到该类型的服务，则会抛出异常。因此，GetRequiredService() 方法应该用于那些必须在容器中找到服务实例才能继续运行的情况。

GetService() 方法也会在容器中查找所请求的服务类型，但是当找不到该类型的服务时，它会返回 null 而不是抛出异常。因此，GetService() 方法适用于那些可选的或者可为 null 的服务实例的情况。
