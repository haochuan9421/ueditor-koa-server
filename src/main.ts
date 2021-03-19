import path from "path";
import { ensureDirSync } from "fs-extra";
import { statSync } from "fs";
import Koa from "koa";
import Router from "koa-router";
import koaBody from "koa-body";
import koaStatic from "koa-static";
import koaQs from "koa-qs";
import cors from "@koa/cors";
import { get } from "lodash";
import glob from "glob";
import editorConfig from "./config";
import Uploader, { stateMap } from "./Uploader";

const app = new Koa();
const router = new Router();
const staticRoot = path.join(__dirname, "../public");

ensureDirSync(staticRoot);

// 支持解析 ?foo[]=x&foo[]=y 形式的参数，解析后的结果为 {foo: ['x', 'y']}，UEditor 执行 catchimage 任务时传递的参数就是这种
koaQs(app, "extended");

router.all(
  "/",
  // 允许通过 CORS 的方式跨域请求
  cors(),
  // 解析 request body
  koaBody({
    multipart: true, // 是否解析 multipart/form-data 的内容
    formidable: {
      uploadDir: staticRoot, // 上传文件的存储位置
      keepExtensions: true, // 是否保存文件后缀
      multiples: true, // 是否支持一次请求多个文件
      maxFields: Number.MAX_SAFE_INTEGER,
      maxFieldsSize: Number.MAX_SAFE_INTEGER,
      maxFileSize: Number.MAX_SAFE_INTEGER,
    },
    jsonLimit: Number.MAX_SAFE_INTEGER,
    formLimit: Number.MAX_SAFE_INTEGER,
    textLimit: Number.MAX_SAFE_INTEGER,
  }),
  async (ctx: Koa.Context) => {
    const { callback, action } = ctx.query;
    let result: Result | EditorConfig | string = "";

    const {
      fileActionName,
      imageActionName,
      videoActionName,
      scrawlActionName,
      catcherActionName,
      fileManagerActionName,
      imageManagerActionName,
    } = editorConfig;

    switch (action) {
      case "config":
        result = editorConfig;
        break;
      /* 上传图片 */
      case imageActionName:
        {
          const {
            imageFieldName,
            imagePathFormat,
            imageMaxSize,
            imageAllowFiles,
          } = editorConfig;

          const uploader = new Uploader(
            ctx,
            staticRoot,
            imageFieldName,
            {
              pathFormat: imagePathFormat,
              maxSize: imageMaxSize,
              allowFiles: imageAllowFiles,
            },
            "upload"
          );

          result = await uploader.upload();
        }
        break;
      /* 上传涂鸦 */
      case scrawlActionName: {
        const {
          scrawlFieldName,
          scrawlPathFormat,
          scrawlMaxSize,
        } = editorConfig;

        const uploader = new Uploader(
          ctx,
          staticRoot,
          scrawlFieldName,
          {
            pathFormat: scrawlPathFormat,
            maxSize: scrawlMaxSize,
            oriName: "scrawl.png",
          },
          "base64"
        );
        result = await uploader.upload();
        break;
      }
      /* 上传视频 */
      case videoActionName:
        {
          const {
            videoFieldName,
            videoPathFormat,
            videoMaxSize,
            videoAllowFiles,
          } = editorConfig;

          const uploader = new Uploader(
            ctx,
            staticRoot,
            videoFieldName,
            {
              pathFormat: videoPathFormat,
              maxSize: videoMaxSize,
              allowFiles: videoAllowFiles,
            },
            "upload"
          );

          result = await uploader.upload();
        }
        break;
      /* 上传文件 */
      case fileActionName:
        {
          const {
            fileFieldName,
            filePathFormat,
            fileMaxSize,
            fileAllowFiles,
          } = editorConfig;

          const uploader = new Uploader(
            ctx,
            staticRoot,
            fileFieldName,
            {
              pathFormat: filePathFormat,
              maxSize: fileMaxSize,
              allowFiles: fileAllowFiles,
            },
            "upload"
          );
          result = await uploader.upload();
        }
        break;
      /* 列出图片 */
      case imageManagerActionName:
      /* 列出文件 */
      case fileManagerActionName:
        {
          const { listPath, allowFiles, listSize } = imageManagerActionName
            ? {
                listPath: editorConfig.imageManagerListPath,
                allowFiles: editorConfig.imageManagerAllowFiles,
                listSize: editorConfig.imageManagerListSize,
              }
            : {
                listPath: editorConfig.fileManagerListPath,
                allowFiles: editorConfig.fileManagerAllowFiles,
                listSize: editorConfig.fileManagerListSize,
              };

          const fileRoot = path.join(staticRoot, listPath);
          const files: string[] = await new Promise((resolve) => {
            glob(
              `**/*@(${allowFiles.join("|")})`,
              {
                cwd: fileRoot,
              },
              (error, files) => {
                resolve(error ? [] : files);
              }
            );
          });

          const start = Number(ctx.query.start as any) || 0;
          const size = Number(ctx.query.size as any) || listSize;

          const list = files.slice(start, start + size).map((file) => {
            const { mtime } = statSync(path.join(fileRoot, file));
            const time = mtime.getTime().toString();
            return {
              mtime: Number(time.slice(0, time.length - 3)), // 时间戳不包含毫秒
              url: path.join(listPath, file),
            };
          });

          result = {
            state: files.length
              ? stateMap.SUCCESS
              : stateMap.ERROR_FILE_NOT_FOUND,
            list,
            start,
            total: files.length,
          };
        }
        break;
      /* 抓取远程文件 */
      case catcherActionName:
        {
          const {
            catcherFieldName,
            catcherPathFormat,
            catcherMaxSize,
            catcherAllowFiles,
          } = editorConfig;

          const source: string[] =
            get(ctx, `request.body.${catcherFieldName}`) ||
            get(ctx, `query.${catcherFieldName}`);

          const remoteList: Result[] = await Promise.all(
            source.map((imgUrl) => {
              const uploader = new Uploader(
                ctx,
                staticRoot,
                imgUrl,
                {
                  pathFormat: catcherPathFormat,
                  maxSize: catcherMaxSize,
                  allowFiles: catcherAllowFiles,
                  oriName: "remote.png",
                },
                "remote"
              );
              return uploader.upload();
            })
          );

          result = {
            state: remoteList.length
              ? stateMap.SUCCESS
              : stateMap.ERROR_UNKNOWN,
            list: remoteList.map((item, index) => ({
              ...item,
              source: source[index],
            })),
          };
        }
        break;
      default:
        result = { state: "请求地址出错" };
        break;
    }

    if (typeof callback === "string") {
      result = /^[\w_]+$/.test(callback)
        ? `${callback}(${JSON.stringify(result)})`
        : { state: "callback参数不合法" };
    }

    ctx.body = result;
  }
);

app.use(router.routes()).use(router.allowedMethods());
app.use(koaStatic(staticRoot));

app.listen(3000, "0.0.0.0", () => {
  console.log("启动成功，http://127.0.0.1:3000");
});
