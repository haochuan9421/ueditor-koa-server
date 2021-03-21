import path from "path";
import Koa from "koa";
import glob from "glob";
import { statSync } from "fs";
import stateMap from "../../const/state-map";

const DiskListManager: ListManagerConstrctor = class DiskListManager
  implements IListManager {
  constructor(public ctx: Koa.Context) {
    this.ctx = ctx;
  }

  async listFile({
    listPath,
    allowFiles,
    listSize,
  }: ListOptions): Promise<Result> {
    const fileRoot = path.join(this.ctx.staticRoot, listPath);

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

    const start = Number(this.ctx.query.start as string) || 0;
    const size = Number(this.ctx.query.size as string) || listSize;

    const list = files.slice(start, start + size).map((file) => {
      const { mtime } = statSync(path.join(fileRoot, file));
      const time = mtime.getTime().toString();
      return {
        mtime: Number(time.slice(0, time.length - 3)), // 时间戳不包含毫秒
        url: path.join(listPath, file),
      };
    });

    return {
      state: files.length ? stateMap.SUCCESS : stateMap.ERROR_FILE_NOT_FOUND,
      list,
      start,
      total: files.length,
    };
  }
};

export default DiskListManager;
