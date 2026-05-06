import {
  type AcceptedTenantInvite,
  type AcceptTenantInviteInput,
  acceptTenantInviteSchema,
  type LookupTenantInviteInput,
  lookupTenantInviteSchema,
  type TenantInviteLookup,
} from "@agendarhorario/shared";
import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Inject,
  NotFoundException,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { ZodValidationPipe } from "../../presentation/pipes/zod-validation.pipe.js";
import {
  TenantInviteAlreadyUsedError,
  TenantInviteExpiredError,
  TenantInviteInvalidError,
  TenantOnboardingInvalidCredentialsError,
  TenantOnboardingUseCases,
} from "../application/tenant-onboarding.use-cases.js";

@Controller("admin/onboarding")
export class AdminOnboardingController {
  constructor(
    @Inject(TenantOnboardingUseCases)
    private readonly onboarding: TenantOnboardingUseCases,
  ) {}

  @AllowAnonymous()
  @Post("lookup")
  @HttpCode(200)
  lookup(
    @Body(new ZodValidationPipe(lookupTenantInviteSchema)) input: LookupTenantInviteInput,
  ): Promise<TenantInviteLookup> {
    return this.mapInviteErrors(() => this.onboarding.lookupInvite(input));
  }

  @AllowAnonymous()
  @Post("accept")
  accept(
    @Body(new ZodValidationPipe(acceptTenantInviteSchema)) input: AcceptTenantInviteInput,
  ): Promise<AcceptedTenantInvite> {
    return this.mapInviteErrors(() => this.onboarding.acceptInvite(input));
  }

  private async mapInviteErrors<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof TenantInviteInvalidError) {
        throw new NotFoundException("Tenant invite not found");
      }

      if (
        error instanceof TenantInviteExpiredError ||
        error instanceof TenantInviteAlreadyUsedError
      ) {
        throw new ConflictException("Tenant invite is not usable");
      }

      if (error instanceof TenantOnboardingInvalidCredentialsError) {
        throw new UnauthorizedException("Invalid onboarding credentials");
      }

      throw error;
    }
  }
}
