import Koa from "koa";
import stateMap from "../../const/state-map";
import cos from "./cos";

const CosListManager: ListManagerConstrctor = class CosListManager
  implements IListManager {
  constructor(public ctx: Koa.Context) {
    this.ctx = ctx;
  }
  // 腾讯云对象存储目前（21年3月）还不支持按文件类型进行过滤，也不支持从指定下标开始查找（Marker 是指定具体的开始文件）
  // 所以这里就固定查询一定数量的文件返回，仅做示例。
  // 如果想做的完善点，可以在文件储存的时候保存上传记录到数据库并从数据库查询历史记录返回
  async listFile({
    listPath,
    allowFiles,
    listSize,
  }: ListOptions): Promise<Result> {
    const start = Number(this.ctx.query.start as string) || 0;
    const size = Number(this.ctx.query.size as string) || listSize;

    return new Promise<Result>((resolve) => {
      cos.getBucket(
        {
          Bucket: "ueditor-1302968899",
          Region: "ap-guangzhou",
          Prefix: listPath,
          MaxKeys: size,
        },
        (err, { Contents }) => {
          if (err) {
            resolve({ state: stateMap.ERROR_FILE_NOT_FOUND });
          } else {
            const list = Contents.filter((file) => {
              return allowFiles.some((ext) => file.Key.endsWith(ext));
            }).map((file) => {
              const mtime = new Date(file.LastModified);
              const time = mtime.getTime().toString();
              return {
                mtime: Number(time.slice(0, time.length - 3)), // 时间戳不包含毫秒
                url: file.Key,
              };
            });

            resolve({
              state: list.length
                ? stateMap.SUCCESS
                : stateMap.ERROR_FILE_NOT_FOUND,
              list,
              start,
              total: list.length,
            });
          }
        }
      );
    });
  }
};

export default CosListManager;
