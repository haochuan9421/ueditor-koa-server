import Koa from "koa";

export default function (
  editorConfig: EditorConfig,
  Uploader: UploaderConstructor,
  ListManager: ListManagerConstrctor
) {
  return async function adapter(ctx: Koa.Context, next: Koa.Next) {
    ctx.editorConfig = editorConfig;
    ctx.uploader = new Uploader(ctx);
    ctx.listManager = new ListManager(ctx);
    await next();
  };
}
