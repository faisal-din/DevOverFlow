const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  ASK_QUESTION: "/ask-question",
  PROFILE: (id: string) => `/profile/${id}`,
  TAGS: () => `/tags`,
  TAG: (id: string) => `/tags/${id}`,
};

export default ROUTES;
