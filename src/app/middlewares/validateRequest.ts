import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

const validateRequest =
  (schema: AnyZodObject | ZodEffects<AnyZodObject>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validationData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });

      // update req.body with transformed data
      if (validationData.body) {
        req.body = validationData.body;
      }

      return next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
