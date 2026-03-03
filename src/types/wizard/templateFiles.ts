export type FileType =
  | "agent-instructions"
  | "specific-instructions"
  | "prompts"
  | "skills";
  
export type FileTypes ={
  [key: string]: string;
}

export type FileTypeOption = {
  value: FileType;
  label: string;
};