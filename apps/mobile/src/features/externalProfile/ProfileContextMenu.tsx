import { impactAsync } from 'expo-haptics'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent } from 'react-native'
import ContextMenu, { ContextMenuOnPressNativeEvent } from 'react-native-context-menu-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TripleDot } from 'src/components/icons/TripleDot'
import { Flex } from 'src/components/layout/Flex'
import { setClipboard } from 'src/utils/clipboard'
import { ExplorerDataType, getExplorerLink, openUri } from 'src/utils/linking'
import { ChainId } from 'wallet/src/constants/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'

export function ProfileContextMenu({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const dispatch = useAppDispatch()

  const onPressCopyAddress = useCallback(async () => {
    if (!address) return
    await impactAsync()
    await setClipboard(address)
    dispatch(
      pushNotification({ type: AppNotificationType.Copied, copyType: CopyNotificationType.Address })
    )
  }, [address, dispatch])

  const openExplorerLink = useCallback(async () => {
    await openUri(getExplorerLink(ChainId.Mainnet, address, ExplorerDataType.ADDRESS))
  }, [address])

  const menuActions = useMemo(
    () => [
      {
        title: t('View on Etherscan'),
        action: openExplorerLink,
        systemIcon: 'link',
      },
      {
        title: t('Copy address'),
        action: onPressCopyAddress,
        systemIcon: 'square.on.square',
      },
    ],
    [onPressCopyAddress, openExplorerLink, t]
  )

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={async (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>): Promise<void> => {
        await menuActions[e.nativeEvent.index]?.action()
      }}>
      <TouchableArea
        backgroundColor="textOnDimTertiary"
        borderRadius="roundedFull"
        opacity={0.8}
        padding="spacing8">
        <Flex centered grow height={theme.iconSizes.icon16} width={theme.iconSizes.icon16}>
          <TripleDot color="white" size={3.5} />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}
