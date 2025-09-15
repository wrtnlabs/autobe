import { IAutoBeHackathonParticipant } from "@autobe/interface";

export const useAuthorizationToken = () => {
  return {
    getToken: (): IAutoBeHackathonParticipant.IAuthorized => {
      return JSON.parse(sessionStorage.getItem("hackathon_token") ?? "null");
    },
    setToken: (token: string): void => {
      sessionStorage.setItem("hackathon_token", token);
    },
  };
};
