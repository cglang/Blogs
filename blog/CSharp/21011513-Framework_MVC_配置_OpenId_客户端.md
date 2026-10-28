---
title: 在 .NET Framework + MVC 中配置 OpenId 客户端
description: ""
date: 2021-01-15
category: ".NET"
tags: [.NET]
---

Microsoft for.NET Framework 4发布的OpenID Connect标准库与OpenKeystone不兼容。OpenAthens已经发布了一个更新的库，可以连接到.NET4.5或更高版本的OpenAthens Keystone。其不支持早期版本。

<!-- more -->

## 开始

### 新建项目

首先我们建立一个 ` ASP.Net MVC` 的项目并安装下列包.

```
Install-Package Microsoft.AspNet.Identity.Owin
Install-Package Microsoft.Owin.Host.SystemWeb
Install-Package OpenAthens.Owin.Security.OpenIdConnect
```

### 添加`StartUp`启动类

在项目根目录下添加 `StartUp` 类.

> 添加 > 新建项 搜索 `startup`，选择 `OWIN StartUp 类` 选型新建。

```csharp
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.Owin;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Owin;
using OpenAthens.Owin.Security.OpenIdConnect;
using System.Configuration;

[assembly: OwinStartup(typeof(WebApplication1.Startup))]
namespace WebApplication1
{
   public partial class Startup
   {
       public void Configuration(IAppBuilder app)
       {
           ConfigureAuth(app);
       }
       
       public void ConfigureAuth(IAppBuilder app)
       {
           app.SetDefaultSignInAsAuthenticationType(CookieAuthenticationDefaults.AuthenticationType);
           app.UseCookieAuthentication(new CookieAuthenticationOptions());
           var oidcOptions = new OpenIdConnectAuthenticationOptions
           {
               Authority = "授权服务器地址",
               ClientId = "客户端Id",
               ClientSecret = "客户端秘钥",
               GetClaimsFromUserInfoEndpoint = true,
               PostLogoutRedirectUri = "登出重定向uri",
               RedirectUri = "重定向Uri",
               ResponseType = OpenIdConnectResponseType.Code,
               Scope = OpenIdConnectScope.OpenId // 按自己需要自行添加即可
           };
           app.UseOpenIdConnectAuthentication(oidcOptions);
       }
   }
}
```

如果启动时StartUp类没有加载,可在Web.config 配置文件 `appSettings` 节点下添加下列配置

```xml
<appSettings>
    <add key="owin:AppStartup" value="<namespace>.Startup, <assembly>" />
</appSettings>
```

### 读取用户Claims信息

```csharp
var claims = System.Security.Claims.ClaimsPrincipal.Current.Claims;
```

---

参考
https://docs.openathens.net/pages/releaseview.action?pageId=2228523#app-switcher