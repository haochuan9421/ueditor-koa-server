import path from "path";
import os from "os";
import Koa from "koa";
import Router from "koa-router";
import koaBody from "koa-body";
import koaStatic from "koa-static";
import koaQs from "koa-qs";
import cors from "@koa/cors";
import adapter from "./adapter";
import controller from "./controller";
import DiskUploader from "./disk/Uploader";
import DiskListManager from "./disk/ListManager";
import diskEditorConfig from "./disk/config";

const app = new Koa();
const router = new Router();
const staticRoot = path.join(__dirname, "../public");

// 支持解析 ?foo[]=x&foo[]=y 形式的参数，解析后的结果为 {foo: ['x', 'y']}，UEditor 执行 catchimage 任务时传递的参数就是这种
koaQs(app, "extended");

// 允许通过 CORS 的方式跨域请求
router.use(cors());

// 解析 request body
router.use(
  koaBody({
    multipart: true, // 是否解析 multipart/form-data 的内容
    formidable: {
      uploadDir: os.tmpdir(), // 上传文件的存储位置（临时）
      keepExtensions: true, // 是否保存文件后缀
      multiples: true, // 是否支持一次请求多个文件
      maxFields: Number.MAX_SAFE_INTEGER, // 框架层的大小限制全部拉到最高，大小控制交给 editorConfig 去决定
      maxFieldsSize: Number.MAX_SAFE_INTEGER,
      maxFileSize: Number.MAX_SAFE_INTEGER,
    },
    jsonLimit: Number.MAX_SAFE_INTEGER,
    formLimit: Number.MAX_SAFE_INTEGER,
    textLimit: Number.MAX_SAFE_INTEGER,
  })
);

router.all(
  "/",
  async (ctx: Koa.Context, next: Koa.Next) => {
    ctx.staticRoot = staticRoot;
    await next();
  },
  adapter(diskEditorConfig, DiskUploader, DiskListManager),
  controller
);

app.use(router.routes()).use(router.allowedMethods());

app.use(koaStatic(staticRoot));

app.listen(3000, "0.0.0.0", () => {
  console.log("启动成功，http://127.0.0.1:3000");
});
