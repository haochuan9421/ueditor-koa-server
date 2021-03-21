# UEditor 服务端代码 Node.js 版本（Koa2 + TypeScript）

### 背景

[UEditor](http://fex.baidu.com/ueditor/#start-start) 依然是国内使用非常广泛的一款富文本编辑器，想完整使用他的功能，不仅需要在前端引入 `UEditor`，也需要部署与之相配套的后端服务，这样才能正常使用图片上传等功能。

正确部署后的 `UEditor` 服务，会提供一个统一的 `HTTP` 请求接口，前端同学只需要把他配置到 `UEDITOR_CONFIG.serverUrl` 中即可。`UEditor` 官方已经提供了 `PHP`、`ASP`、`ASP.NET`、`JSP` 的[部署说明](http://fex.baidu.com/ueditor/#server-deploy)。

本仓库在参考 `PHP` 代码后，简单实现了一个 `Node.js` 版的 `UEditor` 服务，以供有需要的同学参考。基于 `Koa2` + `TypeScript` 开发。

### 运行环境要求

| 环境    | 版本    |
| ------- | ------- |
| Node.js | v12.4   |
| yarn    | v1.22.5 |

> `typescript` 的 `compilerOptions.target` 设置为 `ES2019` 了, `v12.4+` 100% 兼容 `ES2019`（[参考链接](https://node.green/)），想在低版本 Node.js 跑的话，可自行调整一下`tsconfig.json`


这个 Demo 服务已部署到线上（[点击体验](https://haochuan9421.github.io/vue-ueditor-wrap/)），`serverUrl` 为 `https://ueditor.szcloudplus.com/cos`。仅供测试！！！万不可用于生产环境！！！⛔️⛔️⛔️

### FAQ
#### 1、如何上传文件到对象存储（阿里云 OSS、腾讯云 COS、七牛云...）🤔

这些第三方存储平台一般都提供了针对不同语言的 SDK，只需要调用平台的 SDK 把接收到的文件转存过去就可以了，和存储到服务器的磁盘上差距并不大。

本仓库提供了上传文件到**磁盘**和**腾讯云 COS**的示例。考虑到文件存储介质虽然不同，但是接受 `UEditor` 的请求和返回数据这部分逻辑是想同的，所以抽离出了公用的 `ueditor-controller` 用于处理 `UEditor` 不同类型的请求（上传图片、上传涂鸦、抓取远程图片、获取文件列表...）。

在具体到处理文件存取时，分别由 `Uploader` 类（存）和 `ListManager` 类（取）来完成。只需要按照下面的接口实现（`implements`）具体平台的类即可。

```ts
interface IUploader {
  ctx: Koa.Context;
  getFilePath(format: string, originName: string);
  uploadFile(options: FileUploadOptions): Promise<Result>;
  saveRemote(options: RemoteUploadOptions): Promise<Result>;
  uploadBase64(options: Base64UploadOptions): Promise<Result>;
}
```

```ts
interface IListManager {
  ctx: Koa.Context;
  listFile(options: ListOptions): Promise<Result>;
}
```
`腾讯云 COS` 对应的 `Uploader` 类是 `src/adapter/cos/Uploader.ts`，`ListManager` 类是 `src/adapter/cos/ListManager.ts`，以供参考。

具体的使用方式如下。

```ts
// 上传到腾讯云对象存储
router.all(
  "/cos",
  adapter(cosEditorConfig, CosUploader, CosListManager),
  ueditorController
);
```
> 对于不使用 Node.js 的同学，各大对象存储平台也提供了针对其他语言的 SDK，前端并不需要处理什么，由后端同学完成 `UEDITOR_CONFIG.serverUrl` 接口的实现即可。
#### 2、跨域怎么解决😰

常见的解决跨域的方式是 **CORS** 和 **反向代理**，本仓库为了给大家做测试，采用了 CORS 的方式解决跨域。

但是建议大家在生产环境最好采用反向代理的方式把前端页面和后端服务部署到同一个域名下。