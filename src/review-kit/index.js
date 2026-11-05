// The design review page, the same in every project. Mount it on a route, for example:
//   <Route path="/review" element={<ReviewPage />} />
// and, in the app's entry file, so the preview frames can outline a component:
//   installHighlight((folder) => import(`components/${folder}/index.js`));
export { default as ReviewPage } from "./ReviewPage";
export { installHighlight } from "./embedHighlight";
