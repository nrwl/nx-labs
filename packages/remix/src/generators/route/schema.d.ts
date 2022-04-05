export interface RemixRouteSchema {
  project: string;
  path: string;
  style: 'css' | 'none';
  action: boolean;
  meta: boolean;
  loader: boolean;
}
