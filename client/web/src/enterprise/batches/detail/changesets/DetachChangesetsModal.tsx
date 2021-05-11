import Dialog from '@reach/dialog'
import React, { useCallback, useState } from 'react'

import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { TelemetryProps } from '@sourcegraph/shared/src/telemetry/telemetryService'
import { asError, isErrorLike } from '@sourcegraph/shared/src/util/errors'

import { ErrorAlert } from '../../../../components/alerts'
import { Scalars } from '../../../../graphql-operations'
import { detachChangesets } from '../backend'

export interface DetachChangesetsModalProps extends TelemetryProps {
    onCancel: () => void
    afterCreate: () => void
    batchChangeID: Scalars['ID']
    changesetIDs: () => Promise<Scalars['ID'][]>

    /** For testing only. */
    // createBatchChangesCredential?: typeof _createBatchChangesCredential
}

export const DetachChangesetsModal: React.FunctionComponent<DetachChangesetsModalProps> = ({
    onCancel,
    afterCreate,
    batchChangeID,
    changesetIDs,
    telemetryService,
    // createBatchChangesCredential = _createBatchChangesCredential,
}) => {
    const [isLoading, setIsLoading] = useState<boolean | Error>(false)

    const onSubmit = useCallback<React.FormEventHandler>(
        async event => {
            event.preventDefault()
            setIsLoading(true)
            try {
                const ids = await changesetIDs()
                await detachChangesets(batchChangeID, ids)
                telemetryService.logViewEvent('BatchChangeDetailsPageDetachArchivedChangesets')
                afterCreate()
            } catch (error) {
                setIsLoading(asError(error))
            }
        },
        [changesetIDs, batchChangeID, telemetryService, afterCreate]
    )

    return (
        <Dialog className="modal-body modal-body--top-third p-4 rounded border" onDismiss={onCancel}>
            <div className="web-content">
                <h3>Detach changesets</h3>
                <p className="mb-4">Are you sure you want to detach the selected changesets?</p>
                {isErrorLike(isLoading) && <ErrorAlert error={isLoading} />}
                <div className="d-flex justify-content-end">
                    <button
                        type="button"
                        disabled={isLoading === true}
                        className="btn btn-outline-secondary mr-2"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button type="button" onClick={onSubmit} disabled={isLoading === true} className="btn btn-primary">
                        {isLoading === true && <LoadingSpinner className="icon-inline" />}
                        Detach
                    </button>
                </div>
            </div>
        </Dialog>
    )
}
