import path from 'path';
import { ensureDirSync } from 'fs-extra';
import Koa from 'koa';
import Router from 'koa-router';
import koaBody from 'koa-body';
import koaStatic from 'koa-static';
import cors from '@koa/cors';
import editorConfig from './config';
import Uploader from './Uploader';

const app = new Koa();
const router = new Router();
const staticRoot = path.join(__dirname, '../public');

ensureDirSync(staticRoot);

router.all(
  '/',
  // 允许通过 CORS 的方式跨域请求
  cors(),
  // 解析 request body
  koaBody({
    multipart: true, // 是否解析 multipart/form-data 的内容
    formidable: {
      uploadDir: staticRoot, // 上传文件的存储位置
      keepExtensions: true, // 是否保存文件后缀
      multiples: true, // 是否支持一次请求多个文件
    },
  }),
  async (ctx: Koa.Context) => {
    const { callback, action } = ctx.query;
    let result: Result | EditorConfig | string = '';
    if (typeof callback === 'string') {
      if (/^[\w_]+$/.test(callback)) {
        result = `${callback}(${JSON.stringify(editorConfig)})`;
      } else {
        result = { state: 'callback参数不合法' };
      }
    } else {
      switch (action) {
        case 'config':
          result = editorConfig;
          break;
        /* 上传图片 */
        case 'uploadimage':
          {
            const { imageFieldName, imagePathFormat, imageMaxSize, imageAllowFiles } = editorConfig;

            const uploader = new Uploader(
              ctx,
              staticRoot,
              imageFieldName,
              {
                pathFormat: imagePathFormat,
                maxSize: imageMaxSize,
                allowFiles: imageAllowFiles,
              },
              'upload'
            );

            result = await uploader.upload();
          }
          break;
        /* 上传涂鸦 */
        case 'uploadscrawl': {
          const { scrawlFieldName, scrawlPathFormat, scrawlMaxSize } = editorConfig;

          const uploader = new Uploader(
            ctx,
            staticRoot,
            scrawlFieldName,
            {
              pathFormat: scrawlPathFormat,
              maxSize: scrawlMaxSize,
              oriName: 'scrawl.png',
            },
            'base64'
          );
          result = await uploader.upload();
        }
        /* 上传视频 */
        case 'uploadvideo':
        /* 上传文件 */
        case 'uploadfile':
        /* 列出图片 */
        case 'listimage':
        /* 列出文件 */
        case 'listfile':
        /* 抓取远程文件 */
        case 'catchimage':

        default:
          result = { state: '请求地址出错' };
          break;
      }
    }

    ctx.body = result;
  }
);

app.use(router.routes()).use(router.allowedMethods());
app.use(koaStatic(staticRoot));

app.listen(3000, '0.0.0.0', () => {
  console.log('启动成功，http://127.0.0.1:3000');
});
