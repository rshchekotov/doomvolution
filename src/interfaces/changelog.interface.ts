export interface Changelog {
  version: string;
  title: string;
  note: string;
  desc: {
    module: string;
    desc: string;
  }[];
}
