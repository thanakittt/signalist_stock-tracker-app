import { inngest } from "@/lib/inngest/client";
import {
  NEWS_SUMMARY_EMAIL_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "./prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { formatDateToday } from "../utils";


export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
        - Country: ${event.data.country}
        - Investment goals: ${event.data.investmentGoals}
        - Risk tolerance: ${event.data.riskTolerance}
        - Preferred industry: ${event.data.preferredIndustry}
    `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        "Thanks for joining Signalist. You now have the tools to track markets and make smart moves.";

      const {
        data: { email, name },
      } = event;
      // email sending logic
      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyNewsSummary = inngest.createFunction(
  { id: "send-daily-news-summary" },
  [{ event: "app/send.daily.news" }, { cron: "0 12 * * *" }],
  async ({ step }) => {
    // Step 1: Get all users
    const users = await step.run("get-all-users", getAllUsersForNewsEmail);
    if (!users || users.length === 0) {
      return {
        success: false,
        message: "No users found for news email",
      };
    }

    // Step 2: For each user, get their watchlist symbols and fetch news
    const userNewsData = await step.run("fetch-news-for-users", async () => {
      const newsPromises = users.map(async (user) => {
        try {
          // Get user's watchlist symbols
          const symbols = await getWatchlistSymbolsByEmail(user.email);

          // Fetch news: symbol-specific if watchlist exists, general otherwise
          const news =
            symbols.length > 0 ? await getNews(symbols) : await getNews();

          return {
            user,
            news: news.slice(0, 6), // Max 6 articles per user
          };
        } catch (error) {
          console.error(`Error fetching news for user ${user.email}:`, error);
          return {
            user,
            news: [],
          };
        }
      });

      return await Promise.all(newsPromises);
    });

    // Step 3: Summarize news via AI
    const userNewsSummaries: { user: User; newsContent: string | null }[] = [];

    for (const { user, news } of userNewsData) {
      try {
        const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace(
          "{{newsData}}",
          JSON.stringify(news, null, 2)
        );

        const response = await step.ai.infer(`summaries-news-${user.email}`, {
          model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
          body: {
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const summaryText =
          (part && "text" in part ? part.text : null) || "No market news.";

        userNewsSummaries.push({ user, newsContent: summaryText });
      } catch (e) {
        console.error(`Failed to summarize news for user ${user.email}:`, e);
        userNewsSummaries.push({ user, newsContent: null });
      }
    }

    // Step 4: Send the emails
    await step.run("send-news-emails", async () => {
      await Promise.all(
        userNewsSummaries.map(async ({ user, newsContent }) => {
          if (!newsContent) return false;

          return sendNewsSummaryEmail({
            email: user.email,
            date: formatDateToday,
            newsContent,
          });
        })
      );
    });

    return {
      success: true,
      message: `Daily news summary sent successfully`,
    };
  }
);
