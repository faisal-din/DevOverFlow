interface SignInWithOAuthParams {
  provider: "github" | "google";
  providerAccountId: string;
  user: {
    name: string;
    email: string;
    image: string;
    username: string;
  };
}

interface AuthCredentials {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface createQuestionParams {
  title: string;
  content: string;
  tags: string[];
}

interface EditQuestionParams extends createQuestionParams {
  questionId: string;
}
