import * as H from 'history'
import React from 'react'

import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { isExtensionEnabled } from '@sourcegraph/shared/src/extensions/extension'
import { PlatformContextProps } from '@sourcegraph/shared/src/platform/context'
import { ExtensionCategory, EXTENSION_CATEGORIES } from '@sourcegraph/shared/src/schema/extensionSchema'
import { SettingsCascadeProps, SettingsSubject } from '@sourcegraph/shared/src/settings/settings'
import { ThemeProps } from '@sourcegraph/shared/src/theme'
import { isErrorLike } from '@sourcegraph/shared/src/util/errors'

import { ErrorAlert } from '../components/alerts'

import { ExtensionCard } from './ExtensionCard'
import { ExtensionListData, ExtensionsEnablement } from './ExtensionRegistry'
import { applyCategoryFilter, applyExtensionsEnablement } from './extensions'
import { ExtensionsAreaRouteContext } from './ExtensionsArea'

interface Props
    extends SettingsCascadeProps,
        PlatformContextProps<'settings' | 'updateSettings' | 'requestGraphQL'>,
        Pick<ExtensionsAreaRouteContext, 'authenticatedUser'>,
        ThemeProps {
    subject: Pick<SettingsSubject, 'id' | 'viewerCanAdminister'>
    location: H.Location

    data: ExtensionListData | undefined
    selectedCategories: ExtensionCategory[]
    enablementFilter: ExtensionsEnablement
    query: string
    showMoreExtensions: boolean
}

const LOADING = 'loading' as const

/**
 * Displays a list of extensions.
 */
export const ExtensionsList: React.FunctionComponent<Props> = ({
    subject,
    settingsCascade,
    platformContext,
    data,
    selectedCategories,
    enablementFilter,
    query,
    showMoreExtensions,
    authenticatedUser,
    ...props
}) => {
    /** Categories, but with 'Programming Languages' at the end */
    const ORDERED_EXTENSION_CATEGORIES: ExtensionCategory[] = React.useMemo(
        () => [
            ...EXTENSION_CATEGORIES.filter(category => category !== 'Programming languages'),
            'Programming languages',
        ],
        []
    )

    if (!data || data === LOADING) {
        return <LoadingSpinner className="icon-inline" />
    }

    if (isErrorLike(data)) {
        return <ErrorAlert error={data} />
    }

    const { error, extensions, extensionIDsByCategory } = data

    if (Object.keys(extensions).length === 0) {
        return (
            <>
                {error && <ErrorAlert className="mb-2" error={error} />}
                {query ? (
                    <div className="text-muted">
                        No extensions match <strong>{query}</strong>.
                    </div>
                ) : (
                    <span className="text-muted">No extensions found</span>
                )}
            </>
        )
    }

    // Don't display programming language extensions by default
    const renderLanguages =
        (selectedCategories.length === 0 && showMoreExtensions) || selectedCategories.includes('Programming languages')

    const filteredCategoryIDs = ORDERED_EXTENSION_CATEGORIES.filter(category => {
        if (category === 'Programming languages') {
            return renderLanguages
        }

        return selectedCategories.length === 0 || selectedCategories.includes(category)
    })

    const filteredCategories = applyExtensionsEnablement(
        applyCategoryFilter(extensionIDsByCategory, ORDERED_EXTENSION_CATEGORIES, selectedCategories),
        filteredCategoryIDs,
        enablementFilter,
        settingsCascade.final
    )

    // Settings subjects for extension toggle
    const viewerSubject = settingsCascade.subjects?.find(settingsSubject => settingsSubject.subject.id === subject.id)
        ?.subject
    // TODO(card redesign): find Site subject for site admins, render site-wide toggle

    const categorySections = filteredCategoryIDs
        .filter(category => filteredCategories[category].length > 0)
        .map(category => (
            <div key={category} className="mt-1">
                <h3 className="extensions-list__category font-weight-bold">{category}</h3>
                <div className="extensions-list__cards mt-1">
                    {filteredCategories[category].map(extensionId => (
                        <ExtensionCard
                            key={extensionId}
                            subject={subject}
                            viewerSubject={viewerSubject}
                            node={extensions[extensionId]}
                            settingsCascade={settingsCascade}
                            platformContext={platformContext}
                            enabled={isExtensionEnabled(settingsCascade.final, extensionId)}
                            isLightTheme={props.isLightTheme}
                            settingsURL={authenticatedUser?.settingsURL}
                        />
                    ))}
                </div>
            </div>
        ))

    return (
        <>
            {error && <ErrorAlert className="mb-2" error={error} />}
            {categorySections.length > 0 ? (
                categorySections
            ) : (
                <div className="text-muted">
                    No extensions match <strong>{query}</strong> in the selected categories.
                </div>
            )}
        </>
    )
}
