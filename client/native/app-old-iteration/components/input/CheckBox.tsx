import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import { TouchableOpacity, Text } from 'react-native'
import { Colors, Theme } from '@/constants/Colors'
import CheckmarkIcon from '../icons/CheckmarkIcon'

interface CheckboxProps {
    value: boolean
    onValueChange: (value: boolean) => void,
    className?: string
}

function CheckBox({ value, onValueChange, className }: CheckboxProps) {
    const [status, setStatus] = useState<boolean>(value);

    useEffect(() => {
        onValueChange(status)
    }, [status])

    const handleValueChange = () => {
        setStatus(prev => !prev)
    }

    return (
        <TouchableOpacity className={clsx('border-bg-lighter w-8 h-8 rounded-lg flex justify-center text-center align-middle items-center border', className, status ? "border-text-secondary" : "border-2")} onPress={handleValueChange}>
            {status && <CheckmarkIcon className='mx-auto' width='24' height='24' strokeWidth={0.5} fill={Colors[Theme]['text-secondary']} />}
        </TouchableOpacity>
    )
}

export default CheckBox