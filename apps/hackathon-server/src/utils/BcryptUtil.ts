import * as bcrypt from "bcryptjs";

export namespace BcryptUtil {
  export const hash = async (input: string) => {
    const salt: string = await bcrypt.genSalt();
    return bcrypt.hash(input, salt);
  };

  export const equals = async (props: { input: string; hashed: string }) =>
    bcrypt.compare(props.input, props.hashed);
}
