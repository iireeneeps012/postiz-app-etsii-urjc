'use client';

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { UserDetailDto } from '@gitroom/nestjs-libraries/dtos/users/user.details.dto';
import { Input } from '@gitroom/react/form/input';
import { Button } from '@gitroom/react/form/button';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { showMediaBox } from '@gitroom/frontend/components/media/media.component';
import { useUser } from '@gitroom/frontend/components/layout/user.context';

type ProfileForm = {
  fullname: string;
  bio: string;
  picture?: { id: string; path: string } | null;
};

export const ProfileComponent: FC<{
  forcePasswordChange?: boolean;
  onPasswordChanged?: () => void | Promise<void>;
}> = ({ forcePasswordChange, onPasswordChanged }) => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const user = useUser();
  const resolver = useMemo(() => classValidatorResolver(UserDetailDto), []);
  const form = useForm<ProfileForm>({
    resolver,
    defaultValues: {
      fullname: '',
      bio: '',
      picture: null,
    },
  });
  const picture = form.watch('picture');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadProfile = useCallback(async () => {
    const personal = await (await fetch('/user/personal')).json();
    form.setValue('fullname', personal.name || '');
    form.setValue('bio', personal.bio || '');
    form.setValue('picture', personal.picture || null);
  }, [fetch, form]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const openMedia = useCallback(() => {
    showMediaBox((values: any) => {
      form.setValue('picture', Array.isArray(values) ? values[0] : values);
    });
  }, [form]);

  const removePicture = useCallback(() => {
    form.setValue('picture', null);
  }, [form]);

  const submitProfile = useCallback(
    async (values: ProfileForm) => {
      setLoadingProfile(true);
      const response = await fetch('/user/personal', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setLoadingProfile(false);

      if (response.status >= 400) {
        toaster.show(await response.text(), 'warning');
        return;
      }

      toaster.show(t('profile_updated', 'Profile updated'), 'success');
    },
    [fetch, toaster, t]
  );

  const submitPassword = useCallback(async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toaster.show(
        t('passwords_do_not_match', 'Passwords do not match'),
        'warning'
      );
      return;
    }

    setLoadingPassword(true);
    const response = await fetch('/user/password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }),
    });
    setLoadingPassword(false);

    if (response.status >= 400) {
      toaster.show(await response.text(), 'warning');
      return;
    }

    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    await onPasswordChanged?.();
    toaster.show(t('password_updated', 'Password updated'), 'success');
  }, [fetch, onPasswordChanged, passwords, toaster, t]);

  const canChangePassword = user?.providerName === 'LOCAL';

  return (
    <div className="flex flex-col">
      <h3 className="text-[20px]">
        {forcePasswordChange
          ? t('password_update_required', 'Password update required')
          : t('profile', 'Profile')}
      </h3>
      <div className="text-customColor18 mt-[4px]">
        {forcePasswordChange
          ? t(
              'password_update_required_description',
              'For security reasons, you need to change your temporary password before continuing.'
            )
          : t(
              'profile_settings_description',
              'Manage your personal information and account access'
            )}
      </div>

      {!forcePasswordChange && (
        <FormProvider {...form}>
          <div className="my-[16px] mt-[16px] bg-sixth border-fifth border rounded-[4px] p-[24px] flex flex-col gap-[20px]">
            <div className="flex items-center gap-[16px]">
              <div className="h-[64px] w-[64px] rounded-full bg-newBgColorInner border border-newTableBorder overflow-hidden flex items-center justify-center text-[24px] font-[600]">
                {picture?.path ? (
                  <img
                    src={picture.path}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user?.email || '?').slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="flex gap-[8px]">
                <Button type="button" onClick={openMedia}>
                  {t('change_picture', 'Change picture')}
                </Button>
                {picture?.path && (
                  <Button
                    type="button"
                    secondary={true}
                    onClick={removePicture}
                  >
                    {t('remove', 'Remove')}
                  </Button>
                )}
              </div>
            </div>

            <Input
              label={t('full_name', 'Full name')}
              name="fullname"
              placeholder={t('full_name', 'Full name')}
            />
            <Input
              label={t('bio', 'Bio')}
              name="bio"
              placeholder={t('bio', 'Bio')}
            />
            <Input
              label={t('email', 'Email')}
              name="email"
              value={user?.email || ''}
              disableForm={true}
              disabled={true}
            />
            <div>
              <Button
                type="button"
                loading={loadingProfile}
                onClick={form.handleSubmit(submitProfile)}
              >
                {t('save_profile', 'Save profile')}
              </Button>
            </div>
          </div>
        </FormProvider>
      )}

      {canChangePassword && (
        <div className="my-[16px] mt-0 bg-sixth border-fifth border rounded-[4px] p-[24px] flex flex-col gap-[20px]">
          <div>
            <div className="text-[16px]">
              {t('change_password', 'Change password')}
            </div>
            <div className="text-[12px] text-customColor18 mt-[4px]">
              {forcePasswordChange
                ? t(
                    'change_temporary_password_description',
                    'Enter the temporary password you used to sign in and set a new one.'
                  )
                : t(
                    'change_password_description',
                    'Use your current password to set a new one'
                  )}
            </div>
          </div>
          <PasswordInput
            label={
              forcePasswordChange
                ? t('temporary_password', 'Temporary password')
                : t('current_password', 'Current password')
            }
            value={passwords.currentPassword}
            onChange={(value) =>
              setPasswords((state) => ({
                ...state,
                currentPassword: value,
              }))
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
            <PasswordInput
              label={t('new_password', 'New password')}
              value={passwords.newPassword}
              onChange={(value) =>
                setPasswords((state) => ({
                  ...state,
                  newPassword: value,
                }))
              }
            />
            <PasswordInput
              label={t('confirm_password', 'Confirm password')}
              value={passwords.confirmPassword}
              onChange={(value) =>
                setPasswords((state) => ({
                  ...state,
                  confirmPassword: value,
                }))
              }
            />
          </div>
          <div>
            <Button
              type="button"
              loading={loadingPassword}
              onClick={submitPassword}
            >
              {t('update_password', 'Update password')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const PasswordInput: FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-[6px]">
    <div className="text-[14px]">{label}</div>
    <input
      className="bg-newBgColorInner h-[42px] border-newTableBorder border rounded-[8px] px-[16px] outline-none text-[14px] text-textColor"
      type="password"
      value={value}
      placeholder={label}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);
