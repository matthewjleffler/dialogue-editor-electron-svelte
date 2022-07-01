import { EventDispatcher } from "./eventDispatcher";

type Validator = (value: string) => boolean;

export enum PromptEvent {
  ShowTextPrompt,
  ShowConfirmPrompt,
}

export interface TextPromptData {
  header: string,
  defaultValue: string,
  prompt?: string,
  placeholder?: string,
  validator?: Validator,
  resolver: (value: string) => void,
}

export interface ConfirmPromptData {
  header: string,
  prompt: string,
  button0: string,
  button1?: string,
  resolver: (value: number) => void,
}

export const promptDispatcher = new EventDispatcher<PromptEvent>();

export const displayTextPrompt = async function (
  header: string,
  defaultValue: string,
  prompt?: string,
  placeholder?: string,
  validator?: Validator
): Promise<string> {
  const promise = new Promise<string>((resolver) => {
    const data: TextPromptData = { header, prompt, defaultValue, placeholder, resolver, validator };
    promptDispatcher.dispatch(PromptEvent.ShowTextPrompt, data);
  });
  return promise;
}

export const displayConfirmPrompt = async function (header: string, prompt: string, button0: string, button1?: string): Promise<number> {
  const promise = new Promise<number>((resolver) => {
    const data: ConfirmPromptData = { header, prompt, button0, button1, resolver };
    promptDispatcher.dispatch(PromptEvent.ShowConfirmPrompt, data);
  });
  return promise;
}
