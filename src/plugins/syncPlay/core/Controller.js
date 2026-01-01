/**
 * Module that exposes SyncPlay calls to external modules.
 * @module components/syncPlay/core/Controller
 */

import * as Helper from './Helper';

/**
 * Class that exposes SyncPlay calls to external modules.
 */
class Controller {
    constructor() {
        this.manager = null;
    }

    /**
     * Initializes the controller.
     * @param {Manager} syncPlayManager The SyncPlay manager.
     */
    init(syncPlayManager) {
        this.manager = syncPlayManager;
    }

    /**
     * Toggles playback status in SyncPlay group.
     */
    playPause() {
        if (this.manager.isPlaying()) {
            this.pause();
        } else {
            this.unpause();
        }
    }

    /**
     * Unpauses playback in SyncPlay group.
     */
    unpause() {
        this.manager.getSyncPlayApi()?.syncPlayUnpause();
    }

    /**
     * Pauses playback in SyncPlay group.
     */
    pause() {
        this.manager.getSyncPlayApi()?.syncPlayPause();

        // Pause locally as well, to give the user some little control.
        const playerWrapper = this.manager.getPlayerWrapper();
        playerWrapper.localPause();
    }

    /**
     * Seeks playback to specified position in SyncPlay group.
     * @param {number} positionTicks The position.
     */
    seek(positionTicks) {
        this.manager.getSyncPlayApi()?.syncPlaySeek({
            seekRequestDto: {
                PositionTicks: positionTicks
            }
        });
    }

    /**
     * Starts playback in SyncPlay group.
     * @param {Object} options The play data.
     */
    play(options) {
        const syncPlayApi = this.manager.getSyncPlayApi();
        const apiClient = this.manager.getApiClient();
        if (!syncPlayApi || !apiClient) return;

        const sendPlayRequest = (items) => {
            const queue = items.map(item => item.Id);
            return syncPlayApi.syncPlaySetNewQueue({
                playRequestDto: {
                    PlayingQueue: queue,
                    PlayingItemPosition: options.startIndex ? options.startIndex : 0,
                    StartPositionTicks: options.startPositionTicks ? options.startPositionTicks : 0
                }
            });
        };

        if (options.items) {
            return Helper.translateItemsForPlayback(apiClient, options.items, options).then(sendPlayRequest);
        } else {
            return Helper.getItemsForPlayback(apiClient, {
                Ids: options.ids.join(',')
            }).then(function (result) {
                return Helper.translateItemsForPlayback(apiClient, result.Items, options).then(sendPlayRequest);
            });
        }
    }

    /**
     * Sets current playing item in SyncPlay group.
     * @param {string} playlistItemId The item playlist identifier.
     */
    setCurrentPlaylistItem(playlistItemId) {
        this.manager.getSyncPlayApi()?.syncPlaySetPlaylistItem({
            setPlaylistItemRequestDto: {
                PlaylistItemId: playlistItemId
            }
        });
    }

    /**
     * Clears the playlist of a SyncPlay group.
     * @param {Array} clearPlayingItem Whether to remove the playing item as well.
     */
    clearPlaylist(clearPlayingItem = false) {
        this.manager.getSyncPlayApi()?.syncPlayRemoveFromPlaylist({
            removeFromPlaylistRequestDto: {
                ClearPlaylist: true,
                ClearPlayingItem: clearPlayingItem
            }
        });
    }

    /**
     * Removes items from SyncPlay group playlist.
     * @param {Array} playlistItemIds The items to remove.
     */
    removeFromPlaylist(playlistItemIds) {
        this.manager.getSyncPlayApi()?.syncPlayRemoveFromPlaylist({
            removeFromPlaylistRequestDto: {
                PlaylistItemIds: playlistItemIds
            }
        });
    }

    /**
     * Moves an item in the SyncPlay group playlist.
     * @param {string} playlistItemId The item playlist identifier.
     * @param {number} newIndex The new position.
     */
    movePlaylistItem(playlistItemId, newIndex) {
        this.manager.getSyncPlayApi()?.syncPlayMovePlaylistItem({
            movePlaylistItemRequestDto: {
                PlaylistItemId: playlistItemId,
                NewIndex: newIndex
            }
        });
    }

    /**
     * Adds items to the SyncPlay group playlist.
     * @param {Object} options The items to add.
     * @param {string} mode The queue mode, optional.
     */
    queue(options, mode = 'Queue') {
        const syncPlayApi = this.manager.getSyncPlayApi();
        const apiClient = this.manager.getApiClient();
        if (!syncPlayApi || !apiClient) return;

        if (options.items) {
            Helper.translateItemsForPlayback(apiClient, options.items, options).then((items) => {
                const itemIds = items.map(item => item.Id);
                syncPlayApi.syncPlayQueue({
                    queueRequestDto: {
                        ItemIds: itemIds,
                        Mode: mode
                    }
                });
            });
        } else {
            Helper.getItemsForPlayback(apiClient, {
                Ids: options.ids.join(',')
            }).then(function (result) {
                Helper.translateItemsForPlayback(apiClient, result.Items, options).then((items) => {
                    const itemIds = items.map(item => item.Id);
                    syncPlayApi.syncPlayQueue({
                        queueRequestDto: {
                            ItemIds: itemIds,
                            Mode: mode
                        }
                    });
                });
            });
        }
    }

    /**
     * Adds items to the SyncPlay group playlist after the playing item.
     * @param {Object} options The items to add.
     */
    queueNext(options) {
        this.queue(options, 'QueueNext');
    }

    /**
     * Plays next item from playlist in SyncPlay group.
     */
    nextItem() {
        this.manager.getSyncPlayApi()?.syncPlayNextItem({
            nextItemRequestDto: {
                PlaylistItemId: this.manager.getQueueCore().getCurrentPlaylistItemId()
            }
        });
    }

    /**
     * Plays previous item from playlist in SyncPlay group.
     */
    previousItem() {
        this.manager.getSyncPlayApi()?.syncPlayPreviousItem({
            previousItemRequestDto: {
                PlaylistItemId: this.manager.getQueueCore().getCurrentPlaylistItemId()
            }
        });
    }

    /**
     * Sets the repeat mode in SyncPlay group.
     * @param {string} mode The repeat mode.
     */
    setRepeatMode(mode) {
        this.manager.getSyncPlayApi()?.syncPlaySetRepeatMode({
            setRepeatModeRequestDto: {
                Mode: mode
            }
        });
    }

    /**
     * Sets the shuffle mode in SyncPlay group.
     * @param {string} mode The shuffle mode.
     */
    setShuffleMode(mode) {
        this.manager.getSyncPlayApi()?.syncPlaySetShuffleMode({
            setShuffleModeRequestDto: {
                Mode: mode
            }
        });
    }

    /**
     * Toggles the shuffle mode in SyncPlay group.
     */
    toggleShuffleMode() {
        let mode = this.manager.getQueueCore().getShuffleMode();
        mode = mode === 'Sorted' ? 'Shuffle' : 'Sorted';

        this.manager.getSyncPlayApi()?.syncPlaySetShuffleMode({
            setShuffleModeRequestDto: {
                Mode: mode
            }
        });
    }
}

export default Controller;
