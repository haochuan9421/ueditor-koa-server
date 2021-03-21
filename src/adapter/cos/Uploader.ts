import { createReadStream, unlinkSync } from "fs";
import { pathExists } from "fs-extra";
import path from "path";
import { isArray, padStart } from "lodash";
import axios from "axios";
import Koa from "koa";
import { File } from "formidable";
import { single } from "validate.js";
import stateMap from "../../const/state-map";
import cos from "./cos";

const CosUploader: UploaderConstructor = class CosUploader
  implements IUploader {
  /**
   * @param  ctx Koa ctx
   */
  constructor(public ctx: Koa.Context) {
    this.ctx = ctx;
  }

  // 替换文件名
  getFilePath(format: string, originName: string) {
    const fileExt = path.extname(originName);
    const fileName = path.basename(originName, fileExt);
    const date = new Date();
    const paddingZero = (num: number): string => padStart(`${num}`, 2, "0");

    format = format.replace("{yyyy}", `${date.getFullYear()}`);
    format = format.replace("{yy}", `${date.getFullYear()}`.slice(-2));
    format = format.replace("{mm}", paddingZero(date.getMonth() + 1));
    format = format.replace("{dd}", paddingZero(date.getDate()));
    format = format.replace("{hh}", paddingZero(date.getHours()));
    format = format.replace("{ii}", paddingZero(date.getMinutes()));
    format = format.replace("{ss}", paddingZero(date.getSeconds()));
    format = format.replace("{time}", `${date.getTime()}`);
    format = format.replace("{filename}", fileName);
    format = format.replace(/\{rand:([0-9]+)\}/g, function (_, times) {
      const alphabet = "abcdefghijklmnopqrstuvwxyz";
      let str = "";
      for (let i = 0; i < Number(times); i++) {
        str += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      }
      return str;
    });

    return `${format}${fileExt}`;
  }

  /**
   * 上传文件的处理方法
   */
  async uploadFile({
    fieldName,
    pathFormat,
    maxSize,
    allowFiles,
  }: FileUploadOptions): Promise<Result> {
    const files = this.ctx.request.files?.[fieldName];
    // 判断请求体中是否包含文件
    if (!files) {
      return { state: stateMap.ERROR_FILE_NOT_FOUND };
    }

    // 一次上传一个文件 files 是对象，一次上传多个文件时，files 是数组
    const file: File = isArray(files) ? files[0] : files;
    // 临时文件的存储路径
    const tmpFilePath = file.path;
    // 判断文件是否存在
    if (!(await pathExists(tmpFilePath))) {
      return { state: stateMap.ERROR_TMP_FILE_NOT_FOUND };
    }

    // 检查文件大小是否超出限制
    const fileSize = file.size;
    if (fileSize > maxSize) {
      return { state: stateMap.ERROR_SIZE_EXCEED };
    }

    const originName = file.name;
    const fileExt = path.extname(originName);

    // 检查文件格式是否允许
    if (allowFiles.indexOf(fileExt) === -1) {
      return { state: stateMap.ERROR_TYPE_NOT_ALLOWED };
    }

    // 文件最终要保存的路径
    const filePath = this.getFilePath(pathFormat, originName);

    return new Promise<Result>((resolve) => {
      cos.putObject(
        {
          Bucket: "ueditor-1302968899",
          Region: "ap-guangzhou",
          Key: filePath,
          Body: createReadStream(tmpFilePath),
        },
        (err) => {
          if (err) {
            resolve({ state: stateMap.ERROR_FILE_MOVE });
          } else {
            unlinkSync(tmpFilePath); // 删除临时文件
            resolve({
              state: stateMap.SUCCESS, // 上传状态，上传成功时必须返回"SUCCESS"
              url: filePath, // 返回的地址
              title: path.basename(filePath), // 新文件名
              original: originName, // 原始文件名
              type: fileExt, // 文件类型
              size: fileSize, // 文件大小
            });
          }
        }
      );
    });
  }

  /**
   * 拉取远程图片
   */
  async saveRemote({
    imgUrl,
    pathFormat,
    maxSize,
    allowFiles,
  }: RemoteUploadOptions): Promise<Result> {
    // 检测是否是合法的 URL
    const urlHasError = single(imgUrl, {
      presence: true,
      url: {
        schemes: ["http", "https"],
        allowLocal: false,
        allowDataUrl: false,
      },
    });

    if (urlHasError) {
      return { state: stateMap.INVALID_URL };
    }

    // 检查文件格式是否允许
    const fileExt = path.extname(imgUrl);
    if (allowFiles.indexOf(fileExt) === -1) {
      return { state: stateMap.ERROR_TYPE_NOT_ALLOWED };
    }

    const { host, origin } = new URL(imgUrl);
    return axios({
      method: "GET",
      url: imgUrl,
      headers: {
        // 解决一些网站图片存在防盗链限制的问题
        host: host,
        // referer 最好设置为复制图片时图片所在的网站，而不是图片 URL 的源，但是 UEditor 的 catchimage 请求里没有原网站信息，所以图片抓取可能会失败
        referer: origin,
        // UA 模拟成普通的浏览器
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36",
      },
      responseType: "arraybuffer",
    })
      .then(({ data }) => {
        const fileSize = data.length;
        // 检测文件是否超大小
        if (fileSize > maxSize) {
          return { state: stateMap.ERROR_SIZE_EXCEED };
        }
        const originName = path.basename(imgUrl);
        const filePath = this.getFilePath(pathFormat, originName);

        return new Promise<Result>((resolve) => {
          cos.putObject(
            {
              Bucket: "ueditor-1302968899",
              Region: "ap-guangzhou",
              Key: filePath,
              Body: Buffer.from(data, "binary"),
            },
            (err) => {
              if (err) {
                resolve({ state: stateMap.ERROR_WRITE_CONTENT });
              } else {
                resolve({
                  state: stateMap.SUCCESS,
                  url: filePath,
                  title: path.basename(filePath),
                  original: originName,
                  type: fileExt,
                  size: fileSize,
                });
              }
            }
          );
        });
      })
      .catch(() => Promise.resolve({ state: stateMap.ERROR_DEAD_LINK }));
  }

  /**
   * 处理 base64 编码的图片上传
   */
  async uploadBase64({
    fieldName,
    pathFormat,
    maxSize,
  }: Base64UploadOptions): Promise<Result> {
    const base64String = this.ctx.request.body[fieldName];
    const fakeOriginName = "scrawl.png"; // base64 类型上传的没有文件名
    const fileExt = path.extname(fakeOriginName);
    const filePath = this.getFilePath(pathFormat, fakeOriginName);
    const content = Buffer.from(base64String, "base64");

    // 检查文件大小是否超出限制
    const size = content.length;
    if (size > maxSize) {
      return { state: stateMap.ERROR_SIZE_EXCEED };
    }

    return new Promise<Result>((resolve) => {
      cos.putObject(
        {
          Bucket: "ueditor-1302968899",
          Region: "ap-guangzhou",
          Key: filePath,
          Body: content,
        },
        (err) => {
          if (err) {
            resolve({ state: stateMap.ERROR_WRITE_CONTENT });
          } else {
            resolve({
              state: stateMap.SUCCESS,
              url: filePath,
              title: path.basename(filePath),
              original: fakeOriginName,
              type: fileExt,
              size: size,
            });
          }
        }
      );
    });
  }
};

export default CosUploader;
