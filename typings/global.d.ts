import Koa from "koa";

declare global {
  interface EditorConfig {
    imageActionName: string;
    imageFieldName: string;
    imageMaxSize: number;
    imageAllowFiles: string[];
    imageCompressEnable: boolean;
    imageCompressBorder: number;
    imageInsertAlign: string;
    imageUrlPrefix: string;
    imagePathFormat: string;
    scrawlActionName: string;
    scrawlFieldName: string;
    scrawlPathFormat: string;
    scrawlMaxSize: number;
    scrawlUrlPrefix: string;
    scrawlInsertAlign: string;
    snapscreenActionName: string;
    snapscreenPathFormat: string;
    snapscreenUrlPrefix: string;
    snapscreenInsertAlign: string;
    catcherLocalDomain: string[];
    catcherActionName: string;
    catcherFieldName: string;
    catcherPathFormat: string;
    catcherUrlPrefix: string;
    catcherMaxSize: number;
    catcherAllowFiles: string[];
    videoActionName: string;
    videoFieldName: string;
    videoPathFormat: string;
    videoUrlPrefix: string;
    videoMaxSize: number;
    videoAllowFiles: string[];
    fileActionName: string;
    fileFieldName: string;
    filePathFormat: string;
    fileUrlPrefix: string;
    fileMaxSize: number;
    fileAllowFiles: string[];
    imageManagerActionName: string;
    imageManagerListPath: string;
    imageManagerListSize: number;
    imageManagerUrlPrefix: string;
    imageManagerInsertAlign: string;
    imageManagerAllowFiles: string[];
    fileManagerActionName: string;
    fileManagerListPath: string;
    fileManagerUrlPrefix: string;
    fileManagerListSize: number;
    fileManagerAllowFiles: string[];
  }

  interface Result {
    state: string; //上传状态，上传成功时必须返回"SUCCESS"
    url?: string; // 返回的地址
    title?: string; // 新文件名
    original?: string; // 原始文件名
    type?: string; // 文件类型
    size?: number; // 文件大小
    source?: string; // 抓取远程图片的原始链接
    list?: Result[] | { mtime: number; url: string }[];
    start?: number;
    total?: number;
  }

  interface UploadOptions {
    pathFormat: string;
    maxSize: number;
  }

  interface FileUploadOptions extends UploadOptions {
    fieldName: string;
    allowFiles: string[];
  }

  interface Base64UploadOptions extends UploadOptions {
    fieldName: string;
  }

  interface RemoteUploadOptions extends UploadOptions {
    imgUrl: string;
    allowFiles: string[];
  }

  interface UploaderConstructor {
    new (ctx: Koa.Context): Uploader;
  }

  interface IUploader {
    ctx: Koa.Context;
    getFilePath(format: string, originName: string);
    uploadFile(options: FileUploadOptions): Promise<Result>;
    saveRemote(options: RemoteUploadOptions): Promise<Result>;
    uploadBase64(options: Base64UploadOptions): Promise<Result>;
  }

  interface ListOptions {
    listPath: string;
    allowFiles: string[];
    listSize: number;
  }

  interface ListManagerConstrctor {
    new (ctx: Koa.Context): ListManager;
  }
  interface IListManager {
    ctx: Koa.Context;
    listFile(options: ListOptions): Promise<Result>;
  }
}
