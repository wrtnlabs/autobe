import { AutoBeUserMessageImageContent } from "@autobe/interface";

export const AutoBePlaygroundUserMessageImageContentMovie = (
  props: AutoBePlaygroundUserMessageImageContentMovie.IProps,
) => {
  const { image } = props.content;
  const src: string = image.type === "base64" ? image.data : image.url;
  return <img src={src} width={100} height={100} />;
};
export namespace AutoBePlaygroundUserMessageImageContentMovie {
  export interface IProps {
    content: AutoBeUserMessageImageContent;
  }
}
