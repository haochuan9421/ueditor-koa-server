# UEditor 服务端代码 Node.js 版本（Koa2 + TypeScript）

### 背景

[UEditor](http://fex.baidu.com/ueditor/#start-start) 依然是国内使用非常广泛的一款富文本编辑器，想完整使用他的功能，不仅需要在前端引入 `UEditor`，也需要部署与之相配套的后端服务，这样才能正常使用图片上传等功能。正确部署后的 `UEditor` 服务，通常会提供一个统一的 `HTTP` 请求接口，前端同学只需要把他配置到 `UEDITOR_CONFIG.serverUrl` 中即可。`UEditor` 官方已经提供了 `PHP`、`ASP`、`ASP.NET`、`JSP` 的[部署说明](http://fex.baidu.com/ueditor/#server-deploy)。但是今天在服务端领域，`Node.js` 的使用也越来越广泛，所以本仓库在参考 `PHP` 代码后，简单实现了一个 `Node.js` 版的 `UEditor` 服务，以供有需要的同学参考。基于 `Koa2` + `TypeScript` 开发。

### 运行环境要求

| 环境      | 版本      |
| --------- | --------- |
| `Node.js` | `v12.4`   |
| `yarn`    | `v1.22.5` |

> `typescript` 的 `compilerOptions.target` 设置为 `ES2019` 了, `v12.4+` 100% 兼容 `ES2019`（[参考链接](https://node.green/)），想在低版本 Node.js 跑的话，可自行调整一下`tsconfig.json`
