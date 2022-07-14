import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'

interface TokenBalanceItemProps {
  balance: PortfolioBalance
  onPressToken?: (currency: Currency) => void
}

export function TokenBalanceItem({ balance, onPressToken }: TokenBalanceItemProps) {
  const { amount, relativeChange24 } = balance
  const { currency } = amount

  const onPress = () => {
    onPressToken?.(currency)
  }

  return (
    <Button
      alignItems="center"
      bg="none"
      delayPressIn={150}
      flexDirection="row"
      justifyContent="space-between"
      minHeight={56}
      p="sm"
      onPress={onPress}>
      <AnimatedFlex
        row
        alignItems="center"
        entering={FadeIn}
        exiting={FadeOut}
        flexShrink={1}
        gap="xs"
        overflow="hidden">
        <CurrencyLogo currency={currency} size={32} />
        <Flex alignItems="flex-start" flexShrink={1} gap="none">
          <Text ellipsizeMode="tail" numberOfLines={1} variant="subhead">
            {currency.name ?? currency.symbol}
          </Text>
          <Text color="textSecondary" numberOfLines={1} variant="caption">
            {`${formatCurrencyAmount(amount)}`} {currency.symbol}
          </Text>
        </Flex>
      </AnimatedFlex>
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} justifyContent="space-between">
        <Box alignItems="flex-end" flexBasis="auto" flexShrink={1}>
          <Text variant="body">{formatUSDPrice(balance.balanceUSD)}</Text>
          <RelativeChange change={relativeChange24} />
        </Box>
      </AnimatedFlex>
    </Button>
  )
}
