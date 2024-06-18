import { DiscordSDK, DiscordSDKMock } from "@discord/embedded-app-sdk";
import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
const queryParams = new URLSearchParams(window.location.search);
const isEmbedded = queryParams.get('frame_id') != null;
let discordSdk;
if (isEmbedded) {
    discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
} else {
    // We're using session storage for user_id, guild_id, and channel_id
    // This way the user/guild/channel will be maintained until the tab is closed, even if you refresh
    // Session storage will generate new unique mocks for each tab you open
    // Any of these values can be overridden via query parameters
    // i.e. if you set https://my-tunnel-url.com/?user_id=test_user_id
    // this will override this will override the session user_id value
    const mockUserId = getOverrideOrRandomSessionValue('user_id');
    const mockGuildId = getOverrideOrRandomSessionValue('guild_id');
    const mockChannelId = getOverrideOrRandomSessionValue('channel_id');
    discordSdk = new DiscordSDKMock(import.meta.env.VITE_DISCORD_CLIENT_ID, mockGuildId, mockChannelId);
    const discriminator = String(mockUserId.charCodeAt(0) % 5);
    discordSdk._updateCommandMocks({
        authenticate: async ()=>{
            return {
                access_token: 'mock_token',
                user: {
                    username: mockUserId,
                    discriminator,
                    id: mockUserId,
                    avatar: null,
                    public_flags: 1
                },
                scopes: [],
                expires: new Date(2112, 1, 1).toString(),
                application: {
                    description: 'mock_app_description',
                    icon: 'mock_app_icon',
                    id: 'mock_app_id',
                    name: 'mock_app_name'
                }
            };
        }
    });
}
export { discordSdk };
var SessionStorageQueryParam;
(function(SessionStorageQueryParam) {
    SessionStorageQueryParam["user_id"] = "user_id";
    SessionStorageQueryParam["guild_id"] = "guild_id";
    SessionStorageQueryParam["channel_id"] = "channel_id";
})(SessionStorageQueryParam || (SessionStorageQueryParam = {}));
function getOverrideOrRandomSessionValue(queryParam) {
    const overrideValue = queryParams.get(queryParam);
    if (overrideValue != null) {
        return overrideValue;
    }
    const currentStoredValue = sessionStorage.getItem(queryParam);
    if (currentStoredValue != null) {
        return currentStoredValue;
    }
    // Set queryParam to a random 8-character string
    const randomString = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(queryParam, randomString);
    return randomString;
}
const DiscordContext = /*#__PURE__*/ createContext({
    accessToken: null,
    authenticated: false,
    discordSdk: discordSdk,
    error: null,
    session: {
        user: {
            id: '',
            username: '',
            discriminator: '',
            avatar: null,
            public_flags: 0
        },
        access_token: '',
        scopes: [],
        expires: '',
        application: {
            rpc_origins: undefined,
            id: '',
            name: '',
            icon: null,
            description: ''
        }
    },
    status: 'pending'
});
export function DiscordContextProvider(props) {
    const { authenticate, children, loadingScreen = null, scope } = props;
    const setupResult = useDiscordSdkSetup({
        authenticate,
        scope
    });
    if (loadingScreen && ![
        'error',
        'ready'
    ].includes(setupResult.status)) {
        return /*#__PURE__*/ React.createElement(React.Fragment, null, loadingScreen);
    }
    return /*#__PURE__*/ React.createElement(DiscordContext.Provider, {
        value: setupResult
    }, children);
}
export function useDiscordSdk() {
    return useContext(DiscordContext);
}
/**
 * Authenticate with Discord and return the access token.
 * See full list of scopes: https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
 *
 * @param scope The scope of the authorization (default: ['identify', 'guilds'])
 * @returns The result of the Discord SDK `authenticate()` command
 */ export async function authenticateSdk(options) {
    const { scope = [
        'identify',
        'guilds'
    ] } = options ?? {};
    await discordSdk.ready();
    const { code } = await discordSdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: scope
    });
    const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code
        })
    });
    const { access_token } = await response.json();
    // Authenticate with Discord client (using the access_token)
    const auth = await discordSdk.commands.authenticate({
        access_token
    });
    if (auth == null) {
        throw new Error('Authenticate command failed');
    }
    return {
        accessToken: access_token,
        auth
    };
}
export function useDiscordSdkSetup(options) {
    const { authenticate, scope } = options ?? {};
    const [accessToken, setAccessToken] = useState(null);
    const [session, setSession] = useState(null);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('pending');
    const setupDiscordSdk = useCallback(async ()=>{
        try {
            setStatus('loading');
            await discordSdk.ready();
            if (authenticate) {
                setStatus('authenticating');
                const { accessToken, auth } = await authenticateSdk({
                    scope
                });
                setAccessToken(accessToken);
                setSession(auth);
            }
            setStatus('ready');
        } catch (e) {
            console.error(e);
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred');
            }
            setStatus('error');
        }
    }, [
        authenticate
    ]);
    useStableEffect(()=>{
        setupDiscordSdk();
    });
    return {
        accessToken,
        authenticated: !!accessToken,
        discordSdk,
        error,
        session,
        status
    };
}
/**
 * React in development mode re-mounts the root component initially.
 * This hook ensures that the callback is only called once, preventing double authentication.
 */ function useStableEffect(callback) {
    const isRunning = useRef(false);
    useEffect(()=>{
        if (!isRunning.current) {
            isRunning.current = true;
            callback();
        }
    }, []);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcZmlzaDU4NThcXERvY3VtZW50c1xcRGlzY29yZF9yb2JvXFxzcmNcXGhvb2tzXFx1c2VEaXNjb3JkU2RrLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXNjb3JkU0RLLCBEaXNjb3JkU0RLTW9jayB9IGZyb20gJ0BkaXNjb3JkL2VtYmVkZGVkLWFwcC1zZGsnXG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VDYWxsYmFjaywgdXNlUmVmLCBjcmVhdGVDb250ZXh0LCB1c2VDb250ZXh0IH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgdHlwZSB7IFJlYWN0Tm9kZSB9IGZyb20gJ3JlYWN0J1xuXG50eXBlIFVud3JhcFByb21pc2U8VD4gPSBUIGV4dGVuZHMgUHJvbWlzZTxpbmZlciBVPiA/IFUgOiBUXG50eXBlIERpc2NvcmRTZXNzaW9uID0gVW53cmFwUHJvbWlzZTxSZXR1cm5UeXBlPHR5cGVvZiBkaXNjb3JkU2RrLmNvbW1hbmRzLmF1dGhlbnRpY2F0ZT4+XG50eXBlIEF1dGhvcml6ZUlucHV0ID0gUGFyYW1ldGVyczx0eXBlb2YgZGlzY29yZFNkay5jb21tYW5kcy5hdXRob3JpemU+WzBdXG50eXBlIFNka1NldHVwUmVzdWx0ID0gUmV0dXJuVHlwZTx0eXBlb2YgdXNlRGlzY29yZFNka1NldHVwPlxuXG5jb25zdCBxdWVyeVBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaClcbmNvbnN0IGlzRW1iZWRkZWQgPSBxdWVyeVBhcmFtcy5nZXQoJ2ZyYW1lX2lkJykgIT0gbnVsbFxuXG5sZXQgZGlzY29yZFNkazogRGlzY29yZFNESyB8IERpc2NvcmRTREtNb2NrXG5cbmlmIChpc0VtYmVkZGVkKSB7XG5cdGRpc2NvcmRTZGsgPSBuZXcgRGlzY29yZFNESyhpbXBvcnQubWV0YS5lbnYuVklURV9ESVNDT1JEX0NMSUVOVF9JRClcbn0gZWxzZSB7XG5cdC8vIFdlJ3JlIHVzaW5nIHNlc3Npb24gc3RvcmFnZSBmb3IgdXNlcl9pZCwgZ3VpbGRfaWQsIGFuZCBjaGFubmVsX2lkXG5cdC8vIFRoaXMgd2F5IHRoZSB1c2VyL2d1aWxkL2NoYW5uZWwgd2lsbCBiZSBtYWludGFpbmVkIHVudGlsIHRoZSB0YWIgaXMgY2xvc2VkLCBldmVuIGlmIHlvdSByZWZyZXNoXG5cdC8vIFNlc3Npb24gc3RvcmFnZSB3aWxsIGdlbmVyYXRlIG5ldyB1bmlxdWUgbW9ja3MgZm9yIGVhY2ggdGFiIHlvdSBvcGVuXG5cdC8vIEFueSBvZiB0aGVzZSB2YWx1ZXMgY2FuIGJlIG92ZXJyaWRkZW4gdmlhIHF1ZXJ5IHBhcmFtZXRlcnNcblx0Ly8gaS5lLiBpZiB5b3Ugc2V0IGh0dHBzOi8vbXktdHVubmVsLXVybC5jb20vP3VzZXJfaWQ9dGVzdF91c2VyX2lkXG5cdC8vIHRoaXMgd2lsbCBvdmVycmlkZSB0aGlzIHdpbGwgb3ZlcnJpZGUgdGhlIHNlc3Npb24gdXNlcl9pZCB2YWx1ZVxuXHRjb25zdCBtb2NrVXNlcklkID0gZ2V0T3ZlcnJpZGVPclJhbmRvbVNlc3Npb25WYWx1ZSgndXNlcl9pZCcpXG5cdGNvbnN0IG1vY2tHdWlsZElkID0gZ2V0T3ZlcnJpZGVPclJhbmRvbVNlc3Npb25WYWx1ZSgnZ3VpbGRfaWQnKVxuXHRjb25zdCBtb2NrQ2hhbm5lbElkID0gZ2V0T3ZlcnJpZGVPclJhbmRvbVNlc3Npb25WYWx1ZSgnY2hhbm5lbF9pZCcpXG5cblx0ZGlzY29yZFNkayA9IG5ldyBEaXNjb3JkU0RLTW9jayhpbXBvcnQubWV0YS5lbnYuVklURV9ESVNDT1JEX0NMSUVOVF9JRCwgbW9ja0d1aWxkSWQsIG1vY2tDaGFubmVsSWQpXG5cdGNvbnN0IGRpc2NyaW1pbmF0b3IgPSBTdHJpbmcobW9ja1VzZXJJZC5jaGFyQ29kZUF0KDApICUgNSlcblxuXHRkaXNjb3JkU2RrLl91cGRhdGVDb21tYW5kTW9ja3Moe1xuXHRcdGF1dGhlbnRpY2F0ZTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0YWNjZXNzX3Rva2VuOiAnbW9ja190b2tlbicsXG5cdFx0XHRcdHVzZXI6IHtcblx0XHRcdFx0XHR1c2VybmFtZTogbW9ja1VzZXJJZCxcblx0XHRcdFx0XHRkaXNjcmltaW5hdG9yLFxuXHRcdFx0XHRcdGlkOiBtb2NrVXNlcklkLFxuXHRcdFx0XHRcdGF2YXRhcjogbnVsbCxcblx0XHRcdFx0XHRwdWJsaWNfZmxhZ3M6IDFcblx0XHRcdFx0fSxcblx0XHRcdFx0c2NvcGVzOiBbXSxcblx0XHRcdFx0ZXhwaXJlczogbmV3IERhdGUoMjExMiwgMSwgMSkudG9TdHJpbmcoKSxcblx0XHRcdFx0YXBwbGljYXRpb246IHtcblx0XHRcdFx0XHRkZXNjcmlwdGlvbjogJ21vY2tfYXBwX2Rlc2NyaXB0aW9uJyxcblx0XHRcdFx0XHRpY29uOiAnbW9ja19hcHBfaWNvbicsXG5cdFx0XHRcdFx0aWQ6ICdtb2NrX2FwcF9pZCcsXG5cdFx0XHRcdFx0bmFtZTogJ21vY2tfYXBwX25hbWUnXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH0pXG59XG5cbmV4cG9ydCB7IGRpc2NvcmRTZGsgfVxuXG5lbnVtIFNlc3Npb25TdG9yYWdlUXVlcnlQYXJhbSB7XG5cdHVzZXJfaWQgPSAndXNlcl9pZCcsXG5cdGd1aWxkX2lkID0gJ2d1aWxkX2lkJyxcblx0Y2hhbm5lbF9pZCA9ICdjaGFubmVsX2lkJ1xufVxuXG5mdW5jdGlvbiBnZXRPdmVycmlkZU9yUmFuZG9tU2Vzc2lvblZhbHVlKHF1ZXJ5UGFyYW06IGAke1Nlc3Npb25TdG9yYWdlUXVlcnlQYXJhbX1gKSB7XG5cdGNvbnN0IG92ZXJyaWRlVmFsdWUgPSBxdWVyeVBhcmFtcy5nZXQocXVlcnlQYXJhbSlcblx0aWYgKG92ZXJyaWRlVmFsdWUgIT0gbnVsbCkge1xuXHRcdHJldHVybiBvdmVycmlkZVZhbHVlXG5cdH1cblxuXHRjb25zdCBjdXJyZW50U3RvcmVkVmFsdWUgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKHF1ZXJ5UGFyYW0pXG5cdGlmIChjdXJyZW50U3RvcmVkVmFsdWUgIT0gbnVsbCkge1xuXHRcdHJldHVybiBjdXJyZW50U3RvcmVkVmFsdWVcblx0fVxuXG5cdC8vIFNldCBxdWVyeVBhcmFtIHRvIGEgcmFuZG9tIDgtY2hhcmFjdGVyIHN0cmluZ1xuXHRjb25zdCByYW5kb21TdHJpbmcgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCAxMClcblx0c2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShxdWVyeVBhcmFtLCByYW5kb21TdHJpbmcpXG5cdHJldHVybiByYW5kb21TdHJpbmdcbn1cblxuY29uc3QgRGlzY29yZENvbnRleHQgPSBjcmVhdGVDb250ZXh0PFNka1NldHVwUmVzdWx0Pih7XG5cdGFjY2Vzc1Rva2VuOiBudWxsLFxuXHRhdXRoZW50aWNhdGVkOiBmYWxzZSxcblx0ZGlzY29yZFNkazogZGlzY29yZFNkayxcblx0ZXJyb3I6IG51bGwsXG5cdHNlc3Npb246IHtcblx0XHR1c2VyOiB7XG5cdFx0XHRpZDogJycsXG5cdFx0XHR1c2VybmFtZTogJycsXG5cdFx0XHRkaXNjcmltaW5hdG9yOiAnJyxcblx0XHRcdGF2YXRhcjogbnVsbCxcblx0XHRcdHB1YmxpY19mbGFnczogMFxuXHRcdH0sXG5cdFx0YWNjZXNzX3Rva2VuOiAnJyxcblx0XHRzY29wZXM6IFtdLFxuXHRcdGV4cGlyZXM6ICcnLFxuXHRcdGFwcGxpY2F0aW9uOiB7XG5cdFx0XHRycGNfb3JpZ2luczogdW5kZWZpbmVkLFxuXHRcdFx0aWQ6ICcnLFxuXHRcdFx0bmFtZTogJycsXG5cdFx0XHRpY29uOiBudWxsLFxuXHRcdFx0ZGVzY3JpcHRpb246ICcnXG5cdFx0fVxuXHR9LFxuXHRzdGF0dXM6ICdwZW5kaW5nJ1xufSlcblxuaW50ZXJmYWNlIERpc2NvcmRDb250ZXh0UHJvdmlkZXJQcm9wcyB7XG5cdGF1dGhlbnRpY2F0ZT86IGJvb2xlYW5cblx0Y2hpbGRyZW46IFJlYWN0Tm9kZVxuXHRsb2FkaW5nU2NyZWVuPzogUmVhY3ROb2RlXG5cdHNjb3BlPzogQXV0aG9yaXplSW5wdXRbJ3Njb3BlJ11cbn1cbmV4cG9ydCBmdW5jdGlvbiBEaXNjb3JkQ29udGV4dFByb3ZpZGVyKHByb3BzOiBEaXNjb3JkQ29udGV4dFByb3ZpZGVyUHJvcHMpIHtcblx0Y29uc3QgeyBhdXRoZW50aWNhdGUsIGNoaWxkcmVuLCBsb2FkaW5nU2NyZWVuID0gbnVsbCwgc2NvcGUgfSA9IHByb3BzXG5cdGNvbnN0IHNldHVwUmVzdWx0ID0gdXNlRGlzY29yZFNka1NldHVwKHsgYXV0aGVudGljYXRlLCBzY29wZSB9KVxuXG5cdGlmIChsb2FkaW5nU2NyZWVuICYmICFbJ2Vycm9yJywgJ3JlYWR5J10uaW5jbHVkZXMoc2V0dXBSZXN1bHQuc3RhdHVzKSkge1xuXHRcdHJldHVybiA8Pntsb2FkaW5nU2NyZWVufTwvPlxuXHR9XG5cblx0cmV0dXJuIDxEaXNjb3JkQ29udGV4dC5Qcm92aWRlciB2YWx1ZT17c2V0dXBSZXN1bHR9PntjaGlsZHJlbn08L0Rpc2NvcmRDb250ZXh0LlByb3ZpZGVyPlxufVxuXG5leHBvcnQgZnVuY3Rpb24gdXNlRGlzY29yZFNkaygpIHtcblx0cmV0dXJuIHVzZUNvbnRleHQoRGlzY29yZENvbnRleHQpXG59XG5cbmludGVyZmFjZSBBdXRoZW50aWNhdGVTZGtPcHRpb25zIHtcblx0c2NvcGU/OiBBdXRob3JpemVJbnB1dFsnc2NvcGUnXVxufVxuXG4vKipcbiAqIEF1dGhlbnRpY2F0ZSB3aXRoIERpc2NvcmQgYW5kIHJldHVybiB0aGUgYWNjZXNzIHRva2VuLlxuICogU2VlIGZ1bGwgbGlzdCBvZiBzY29wZXM6IGh0dHBzOi8vZGlzY29yZC5jb20vZGV2ZWxvcGVycy9kb2NzL3RvcGljcy9vYXV0aDIjc2hhcmVkLXJlc291cmNlcy1vYXV0aDItc2NvcGVzXG4gKlxuICogQHBhcmFtIHNjb3BlIFRoZSBzY29wZSBvZiB0aGUgYXV0aG9yaXphdGlvbiAoZGVmYXVsdDogWydpZGVudGlmeScsICdndWlsZHMnXSlcbiAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgdGhlIERpc2NvcmQgU0RLIGBhdXRoZW50aWNhdGUoKWAgY29tbWFuZFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXV0aGVudGljYXRlU2RrKG9wdGlvbnM/OiBBdXRoZW50aWNhdGVTZGtPcHRpb25zKSB7XG5cdGNvbnN0IHsgc2NvcGUgPSBbJ2lkZW50aWZ5JywgJ2d1aWxkcyddIH0gPSBvcHRpb25zID8/IHt9XG5cblx0YXdhaXQgZGlzY29yZFNkay5yZWFkeSgpXG5cdGNvbnN0IHsgY29kZSB9ID0gYXdhaXQgZGlzY29yZFNkay5jb21tYW5kcy5hdXRob3JpemUoe1xuXHRcdGNsaWVudF9pZDogaW1wb3J0Lm1ldGEuZW52LlZJVEVfRElTQ09SRF9DTElFTlRfSUQsXG5cdFx0cmVzcG9uc2VfdHlwZTogJ2NvZGUnLFxuXHRcdHN0YXRlOiAnJyxcblx0XHRwcm9tcHQ6ICdub25lJyxcblx0XHRzY29wZTogc2NvcGVcblx0fSlcblxuXHRjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKCcvYXBpL3Rva2VuJywge1xuXHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdGhlYWRlcnM6IHtcblx0XHRcdCdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcblx0XHR9LFxuXHRcdGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgY29kZSB9KVxuXHR9KVxuXHRjb25zdCB7IGFjY2Vzc190b2tlbiB9ID0gYXdhaXQgcmVzcG9uc2UuanNvbigpXG5cblx0Ly8gQXV0aGVudGljYXRlIHdpdGggRGlzY29yZCBjbGllbnQgKHVzaW5nIHRoZSBhY2Nlc3NfdG9rZW4pXG5cdGNvbnN0IGF1dGggPSBhd2FpdCBkaXNjb3JkU2RrLmNvbW1hbmRzLmF1dGhlbnRpY2F0ZSh7IGFjY2Vzc190b2tlbiB9KVxuXG5cdGlmIChhdXRoID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ0F1dGhlbnRpY2F0ZSBjb21tYW5kIGZhaWxlZCcpXG5cdH1cblx0cmV0dXJuIHsgYWNjZXNzVG9rZW46IGFjY2Vzc190b2tlbiwgYXV0aCB9XG59XG5cbmludGVyZmFjZSBVc2VEaXNjb3JkU2RrU2V0dXBPcHRpb25zIHtcblx0YXV0aGVudGljYXRlPzogYm9vbGVhblxuXHRzY29wZT86IEF1dGhvcml6ZUlucHV0WydzY29wZSddXG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VEaXNjb3JkU2RrU2V0dXAob3B0aW9ucz86IFVzZURpc2NvcmRTZGtTZXR1cE9wdGlvbnMpIHtcblx0Y29uc3QgeyBhdXRoZW50aWNhdGUsIHNjb3BlIH0gPSBvcHRpb25zID8/IHt9XG5cdGNvbnN0IFthY2Nlc3NUb2tlbiwgc2V0QWNjZXNzVG9rZW5dID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbClcblx0Y29uc3QgW3Nlc3Npb24sIHNldFNlc3Npb25dID0gdXNlU3RhdGU8RGlzY29yZFNlc3Npb24gfCBudWxsPihudWxsKVxuXHRjb25zdCBbZXJyb3IsIHNldEVycm9yXSA9IHVzZVN0YXRlPHN0cmluZyB8IG51bGw+KG51bGwpXG5cdGNvbnN0IFtzdGF0dXMsIHNldFN0YXR1c10gPSB1c2VTdGF0ZTwnYXV0aGVudGljYXRpbmcnIHwgJ2Vycm9yJyB8ICdsb2FkaW5nJyB8ICdwZW5kaW5nJyB8ICdyZWFkeSc+KCdwZW5kaW5nJylcblxuXHRjb25zdCBzZXR1cERpc2NvcmRTZGsgPSB1c2VDYWxsYmFjayhhc3luYyAoKSA9PiB7XG5cdFx0dHJ5IHtcblx0XHRcdHNldFN0YXR1cygnbG9hZGluZycpXG5cdFx0XHRhd2FpdCBkaXNjb3JkU2RrLnJlYWR5KClcblxuXHRcdFx0aWYgKGF1dGhlbnRpY2F0ZSkge1xuXHRcdFx0XHRzZXRTdGF0dXMoJ2F1dGhlbnRpY2F0aW5nJylcblx0XHRcdFx0Y29uc3QgeyBhY2Nlc3NUb2tlbiwgYXV0aCB9ID0gYXdhaXQgYXV0aGVudGljYXRlU2RrKHsgc2NvcGUgfSlcblx0XHRcdFx0c2V0QWNjZXNzVG9rZW4oYWNjZXNzVG9rZW4pXG5cdFx0XHRcdHNldFNlc3Npb24oYXV0aClcblx0XHRcdH1cblxuXHRcdFx0c2V0U3RhdHVzKCdyZWFkeScpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlKVxuXHRcdFx0aWYgKGUgaW5zdGFuY2VvZiBFcnJvcikge1xuXHRcdFx0XHRzZXRFcnJvcihlLm1lc3NhZ2UpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzZXRFcnJvcignQW4gdW5rbm93biBlcnJvciBvY2N1cnJlZCcpXG5cdFx0XHR9XG5cdFx0XHRzZXRTdGF0dXMoJ2Vycm9yJylcblx0XHR9XG5cdH0sIFthdXRoZW50aWNhdGVdKVxuXG5cdHVzZVN0YWJsZUVmZmVjdCgoKSA9PiB7XG5cdFx0c2V0dXBEaXNjb3JkU2RrKClcblx0fSlcblxuXHRyZXR1cm4geyBhY2Nlc3NUb2tlbiwgYXV0aGVudGljYXRlZDogISFhY2Nlc3NUb2tlbiwgZGlzY29yZFNkaywgZXJyb3IsIHNlc3Npb24sIHN0YXR1cyB9XG59XG5cbi8qKlxuICogUmVhY3QgaW4gZGV2ZWxvcG1lbnQgbW9kZSByZS1tb3VudHMgdGhlIHJvb3QgY29tcG9uZW50IGluaXRpYWxseS5cbiAqIFRoaXMgaG9vayBlbnN1cmVzIHRoYXQgdGhlIGNhbGxiYWNrIGlzIG9ubHkgY2FsbGVkIG9uY2UsIHByZXZlbnRpbmcgZG91YmxlIGF1dGhlbnRpY2F0aW9uLlxuICovXG5mdW5jdGlvbiB1c2VTdGFibGVFZmZlY3QoY2FsbGJhY2s6ICgpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+KSB7XG5cdGNvbnN0IGlzUnVubmluZyA9IHVzZVJlZihmYWxzZSlcblxuXHR1c2VFZmZlY3QoKCkgPT4ge1xuXHRcdGlmICghaXNSdW5uaW5nLmN1cnJlbnQpIHtcblx0XHRcdGlzUnVubmluZy5jdXJyZW50ID0gdHJ1ZVxuXHRcdFx0Y2FsbGJhY2soKVxuXHRcdH1cblx0fSwgW10pXG59XG4iXSwibmFtZXMiOlsiRGlzY29yZFNESyIsIkRpc2NvcmRTREtNb2NrIiwidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJ1c2VDYWxsYmFjayIsInVzZVJlZiIsImNyZWF0ZUNvbnRleHQiLCJ1c2VDb250ZXh0IiwicXVlcnlQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsInNlYXJjaCIsImlzRW1iZWRkZWQiLCJnZXQiLCJkaXNjb3JkU2RrIiwiZW52IiwiVklURV9ESVNDT1JEX0NMSUVOVF9JRCIsIm1vY2tVc2VySWQiLCJnZXRPdmVycmlkZU9yUmFuZG9tU2Vzc2lvblZhbHVlIiwibW9ja0d1aWxkSWQiLCJtb2NrQ2hhbm5lbElkIiwiZGlzY3JpbWluYXRvciIsIlN0cmluZyIsImNoYXJDb2RlQXQiLCJfdXBkYXRlQ29tbWFuZE1vY2tzIiwiYXV0aGVudGljYXRlIiwiYWNjZXNzX3Rva2VuIiwidXNlciIsInVzZXJuYW1lIiwiaWQiLCJhdmF0YXIiLCJwdWJsaWNfZmxhZ3MiLCJzY29wZXMiLCJleHBpcmVzIiwiRGF0ZSIsInRvU3RyaW5nIiwiYXBwbGljYXRpb24iLCJkZXNjcmlwdGlvbiIsImljb24iLCJuYW1lIiwiU2Vzc2lvblN0b3JhZ2VRdWVyeVBhcmFtIiwicXVlcnlQYXJhbSIsIm92ZXJyaWRlVmFsdWUiLCJjdXJyZW50U3RvcmVkVmFsdWUiLCJzZXNzaW9uU3RvcmFnZSIsImdldEl0ZW0iLCJyYW5kb21TdHJpbmciLCJNYXRoIiwicmFuZG9tIiwic2xpY2UiLCJzZXRJdGVtIiwiRGlzY29yZENvbnRleHQiLCJhY2Nlc3NUb2tlbiIsImF1dGhlbnRpY2F0ZWQiLCJlcnJvciIsInNlc3Npb24iLCJycGNfb3JpZ2lucyIsInVuZGVmaW5lZCIsInN0YXR1cyIsIkRpc2NvcmRDb250ZXh0UHJvdmlkZXIiLCJwcm9wcyIsImNoaWxkcmVuIiwibG9hZGluZ1NjcmVlbiIsInNjb3BlIiwic2V0dXBSZXN1bHQiLCJ1c2VEaXNjb3JkU2RrU2V0dXAiLCJpbmNsdWRlcyIsIlByb3ZpZGVyIiwidmFsdWUiLCJ1c2VEaXNjb3JkU2RrIiwiYXV0aGVudGljYXRlU2RrIiwib3B0aW9ucyIsInJlYWR5IiwiY29kZSIsImNvbW1hbmRzIiwiYXV0aG9yaXplIiwiY2xpZW50X2lkIiwicmVzcG9uc2VfdHlwZSIsInN0YXRlIiwicHJvbXB0IiwicmVzcG9uc2UiLCJmZXRjaCIsIm1ldGhvZCIsImhlYWRlcnMiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImpzb24iLCJhdXRoIiwiRXJyb3IiLCJzZXRBY2Nlc3NUb2tlbiIsInNldFNlc3Npb24iLCJzZXRFcnJvciIsInNldFN0YXR1cyIsInNldHVwRGlzY29yZFNkayIsImUiLCJjb25zb2xlIiwibWVzc2FnZSIsInVzZVN0YWJsZUVmZmVjdCIsImNhbGxiYWNrIiwiaXNSdW5uaW5nIiwiY3VycmVudCJdLCJyYW5nZU1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJtYXBwaW5ncyI6IkFBQUEsU0FBU0EsVUFBVSxFQUFFQyxjQUFjLFFBQVEsNEJBQTJCO0FBQ3RFLFNBQVNDLFFBQVEsRUFBRUMsU0FBUyxFQUFFQyxXQUFXLEVBQUVDLE1BQU0sRUFBRUMsYUFBYSxFQUFFQyxVQUFVLFFBQVEsUUFBTztBQVEzRixNQUFNQyxjQUFjLElBQUlDLGdCQUFnQkMsT0FBT0MsUUFBUSxDQUFDQyxNQUFNO0FBQzlELE1BQU1DLGFBQWFMLFlBQVlNLEdBQUcsQ0FBQyxlQUFlO0FBRWxELElBQUlDO0FBRUosSUFBSUYsWUFBWTtJQUNmRSxhQUFhLElBQUlmLFdBQVcsWUFBWWdCLEdBQUcsQ0FBQ0Msc0JBQXNCO0FBQ25FLE9BQU87SUFDTixvRUFBb0U7SUFDcEUsa0dBQWtHO0lBQ2xHLHVFQUF1RTtJQUN2RSw2REFBNkQ7SUFDN0Qsa0VBQWtFO0lBQ2xFLGtF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