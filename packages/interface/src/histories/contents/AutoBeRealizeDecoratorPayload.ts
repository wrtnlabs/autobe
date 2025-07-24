export interface AutoBeRealizeDecoratorPayload {
  /**
   * The name of the Decorator Payload Type.
   *
   * Specifies the TypeScript type name that defines the structure of the
   * authenticated user data. This type name will be used in Controller method
   * parameters to provide proper type safety and IntelliSense support when
   * working with authenticated user information injected by the decorator.
   */
  name: string;

  /**
   * The implemented code of the Decorator Payload Type.
   *
   * Contains the complete TypeScript type definition code that describes the
   * structure and properties of the authenticated user payload. This code
   * defines the interface or type that will be used to type the parameter in
   * Controller methods, ensuring type safety and proper validation of the user
   * data provided by the authentication system.
   */
  code: string;
}
