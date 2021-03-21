import Koa from "koa";
import { get } from "lodash";
import stateMap from "./state-map";

export default async (ctx: Koa.Context) => {
  let result: Result | EditorConfig | string = "";
  const { callback, action } = ctx.query;
  const {
    fileActionName,
    imageActionName,
    videoActionName,
    scrawlActionName,
    catcherActionName,
    fileManagerActionName,
    imageManagerActionName,
  } = ctx.editorConfig;

  switch (action) {
    case "config":
      result = ctx.editorConfig;
      break;
    /* 上传图片 */
    case imageActionName:
      {
        const {
          imageFieldName,
          imagePathFormat,
          imageMaxSize,
          imageAllowFiles,
        } = ctx.editorConfig;

        result = await ctx.uploader.uploadFile({
          fieldName: imageFieldName,
          pathFormat: imagePathFormat,
          maxSize: imageMaxSize,
          allowFiles: imageAllowFiles,
        });
      }
      break;
    /* 上传涂鸦 */
    case scrawlActionName: {
      const {
        scrawlFieldName,
        scrawlPathFormat,
        scrawlMaxSize,
      } = ctx.editorConfig;

      result = await ctx.uploader.uploadBase64({
        fieldName: scrawlFieldName,
        pathFormat: scrawlPathFormat,
        maxSize: scrawlMaxSize,
      });
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
        } = ctx.editorConfig;

        result = await ctx.uploader.uploadFile({
          fieldName: videoFieldName,
          pathFormat: videoPathFormat,
          maxSize: videoMaxSize,
          allowFiles: videoAllowFiles,
        });
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
        } = ctx.editorConfig;

        result = await ctx.uploader.uploadFile({
          fieldName: fileFieldName,
          pathFormat: filePathFormat,
          maxSize: fileMaxSize,
          allowFiles: fileAllowFiles,
        });
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
        } = ctx.editorConfig;

        const source: string[] =
          get(ctx, `request.body.${catcherFieldName}`) ||
          get(ctx, `query.${catcherFieldName}`) ||
          [];

        const remoteList: Result[] = await Promise.all(
          source.map((imgUrl) => {
            return ctx.uploader.saveRemote({
              imgUrl,
              pathFormat: catcherPathFormat,
              maxSize: catcherMaxSize,
              allowFiles: catcherAllowFiles,
            });
          })
        );

        result = {
          state: remoteList.length ? stateMap.SUCCESS : stateMap.ERROR_UNKNOWN,
          list: remoteList.map((item, index) => ({
            ...item,
            source: source[index],
          })),
        };
      }
      break;
    /* 列出图片 */
    case imageManagerActionName:
      {
        const {
          imageManagerListPath: listPath,
          imageManagerAllowFiles: allowFiles,
          imageManagerListSize: listSize,
        } = ctx.editorConfig;

        result = await ctx.listManager.listFile({
          listPath,
          allowFiles,
          listSize,
        });
      }
      break;
    /* 列出文件 */
    case fileManagerActionName:
      {
        const {
          fileManagerListPath: listPath,
          fileManagerAllowFiles: allowFiles,
          fileManagerListSize: listSize,
        } = ctx.editorConfig;

        result = await ctx.listManager.listFile({
          listPath,
          allowFiles,
          listSize,
        });
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
};
