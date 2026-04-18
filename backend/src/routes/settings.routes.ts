import { Router } from 'express';
import { z } from 'zod';
import { SettingsService } from '../services/settings.service.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { AppError, created, ok } from '../lib/http.js';
import { parseSchema, trimToNull } from '../lib/validation.js';
import { CompanyProfileService } from '../services/company-profile.service.js';

const router = Router();

const settingsPayloadSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string(),
});

const categoryPayloadSchema = z.object({
  name: z.string().trim().min(1),
});

const companyProfileSchema = z.object({
  name: z.string().trim().min(1),
  country: z.union([z.string(), z.undefined(), z.null()]).optional(),
  region: z.union([z.string(), z.undefined(), z.null()]).optional(),
  city: z.union([z.string(), z.undefined(), z.null()]).optional(),
  addressLine: z.union([z.string(), z.undefined(), z.null()]).optional(),
  phone: z.union([z.string(), z.undefined(), z.null()]).optional(),
  note: z.union([z.string(), z.undefined(), z.null()]).optional(),
});

router.get('/public', async (req, res, next) => {
  try {
    const settings = await SettingsService.getSettings();
    ok(res, {
      priceVisibility: settings.priceVisibility || 'everyone',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticate, authorize(['ADMIN']), async (req, res, next) => {
  try {
    ok(res, await SettingsService.getSettings());
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize(['ADMIN']), async (req, res, next) => {
  try {
    const { key, value } = parseSchema(settingsPayloadSchema, req.body);
    ok(res, await SettingsService.updateSetting(key, value));
  } catch (error) {
    next(error);
  }
});

router.get('/categories', authenticate, async (req, res, next) => {
  try {
    ok(res, await SettingsService.getCategories());
  } catch (error) {
    next(error);
  }
});

router.post('/categories', authenticate, authorize(['ADMIN']), async (req, res, next) => {
  try {
    const { name } = parseSchema(categoryPayloadSchema, req.body);
    created(res, await SettingsService.ensureCategory(name));
  } catch (error) {
    next(error);
  }
});

router.get('/company-profile', authenticate, async (req, res, next) => {
  try {
    ok(res, await CompanyProfileService.getActiveProfile());
  } catch (error) {
    next(error);
  }
});

router.post('/company-profile', authenticate, authorize(['ADMIN']), async (req, res, next) => {
  try {
    const body = parseSchema(companyProfileSchema, req.body);

    if (!body.name) {
      throw new AppError('Название компании обязательно', { status: 400, code: 'COMPANY_PROFILE_NAME_REQUIRED' });
    }

    ok(
      res,
      await CompanyProfileService.upsertActiveProfile({
        name: body.name,
        country: trimToNull(body.country),
        region: trimToNull(body.region),
        city: trimToNull(body.city),
        addressLine: trimToNull(body.addressLine),
        phone: trimToNull(body.phone),
        note: trimToNull(body.note),
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
