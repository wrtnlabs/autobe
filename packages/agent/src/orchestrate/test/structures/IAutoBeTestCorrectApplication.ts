export interface IAutoBeTestCorrectApplication {
  rewrite(props: IAutoBeTestCorrectApplication.IProps): void;
}
export namespace IAutoBeTestCorrectApplication {
  export interface IProps {
    think_without_compile_error: string;
    think_again_with_compile_error: string;
    draft: string;
    review: string;
    final: string;
  }
}
