import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { OnboardingStackParamList } from 'src/app/navigation/types'
import { CheckmarkCircle } from 'src/components/icons/CheckmarkCircle'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { backupMnemonicToICloud } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { OnboardingScreens } from 'src/screens/Screens'
import { logger } from 'wallet/src/features/logger/logger'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import { useAsyncData } from 'wallet/src/utils/hooks'
import serializeError from 'wallet/src/utils/serializeError'
import { ONE_SECOND_MS } from 'wallet/src/utils/time'
import { promiseMinDelay } from 'wallet/src/utils/timing'

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  OnboardingScreens.BackupCloudProcessing
>

/** Screen to perform secure recovery phrase backup to Cloud  */
export function CloudBackupProcessingScreen({
  navigation,
  route: {
    params: { password, importType, entryPoint },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const [processing, doneProcessing] = useReducer(() => false, true)

  // Handle finished backing up to Cloud
  useEffect(() => {
    if (activeAccount?.backups?.includes(BackupType.Cloud)) {
      doneProcessing()
      // Show success state for 1s before navigating
      const timer = setTimeout(() => {
        navigation.navigate({
          name: OnboardingScreens.Notifications,
          params: { importType, entryPoint },
          merge: true,
        })
      }, ONE_SECOND_MS)

      return () => clearTimeout(timer)
    }
  }, [activeAccount?.backups, entryPoint, importType, navigation])

  // Handle backup to Cloud when screen appears
  const backup = useCallback(async () => {
    if (!activeAccount?.address) return
    try {
      // Ensure processing state is shown for at least 1s
      await promiseMinDelay(backupMnemonicToICloud(activeAccount.address, password), ONE_SECOND_MS)

      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.AddBackupMethod,
          address: activeAccount.address,
          backupMethod: BackupType.Cloud,
        })
      )
    } catch (error) {
      logger.error('Unable to backup to iCloud', {
        tags: {
          file: 'CloudBackupProcessingScreen',
          function: 'onPressNext',
          error: serializeError(error),
        },
      })

      Alert.alert(
        t('iCloud error'),
        t(
          'Unable to backup recovery phrase to iCloud. Please ensure you have iCloud enabled with available storage space and try again.'
        ),
        [
          {
            text: t('OK'),
            style: 'default',
            onPress: (): void => {
              navigation.goBack()
            },
          },
        ]
      )
    }
  }, [activeAccount?.address, dispatch, password, t, navigation])

  useAsyncData(backup)

  return (
    <Screen>
      {processing ? (
        <Flex centered grow gap="spacing24">
          <ActivityIndicator size="large" />
          <Text variant="headlineSmall">{t('Backing up to iCloud...')}</Text>
        </Flex>
      ) : (
        <Flex centered grow gap="spacing24">
          <CheckmarkCircle
            borderColor="accentSuccess"
            borderWidth={3}
            checkmarkStrokeWidth={2}
            color={theme.colors.accentSuccess}
            size={theme.iconSizes.icon40}
          />
          <Text variant="headlineSmall">{t('Backed up to iCloud')}</Text>
        </Flex>
      )}
    </Screen>
  )
}
