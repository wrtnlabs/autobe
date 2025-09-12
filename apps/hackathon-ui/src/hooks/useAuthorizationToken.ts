import { IAutobeHackathonParticipant } from "@autobe/interface";

export const useAuthorizationToken = () => {
  return {
    getToken: (): IAutobeHackathonParticipant.IAuthorized => {
      return JSON.parse(sessionStorage.getItem("hackathon_token") ?? "null");
    },
    setToken: (token: string): void => {
      sessionStorage.setItem("hackathon_token", token);
    },
  };
};
